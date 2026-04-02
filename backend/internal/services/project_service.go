package services

import (
	"encoding/json"
	"errors"

	"github.com/google/uuid"
	"rex-backend/internal/models"
	"rex-backend/internal/repository"
)

type ProjectService struct {
	projectRepo  *repository.ProjectRepository
	activityRepo *repository.ActivityRepository
	orgRepo      *repository.OrganizationRepository
}

func NewProjectService(projectRepo *repository.ProjectRepository, activityRepo *repository.ActivityRepository, orgRepo *repository.OrganizationRepository) *ProjectService {
	return &ProjectService{
		projectRepo:  projectRepo,
		activityRepo: activityRepo,
		orgRepo:      orgRepo,
	}
}

type CreateProjectInput struct {
	Key         string `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
}

type UpdateProjectInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
}

func (s *ProjectService) Create(input CreateProjectInput, ownerID, organizationID uuid.UUID) (*models.Project, error) {
	// Check if project key already exists
	existingProject, err := s.projectRepo.FindByKeyInOrganization(input.Key, organizationID)
	if err == nil && existingProject != nil {
		return nil, errors.New("project with this key already exists")
	}

	project := &models.Project{
		OrganizationID: organizationID,
		Key:            input.Key,
		Name:           input.Name,
		Description:    input.Description,
		Icon:           input.Icon,
		Color:          input.Color,
		OwnerID:        ownerID,
	}

	if err := s.projectRepo.Create(project); err != nil {
		return nil, err
	}

	// Add owner as admin member
	member := &models.ProjectMember{
		ProjectID: project.ID,
		UserID:    ownerID,
		Role:      "owner",
	}
	_ = s.projectRepo.AddMember(member)

	// Log activity
	s.logActivity(ownerID, &project.ID, nil, "created", "project", project.ID, nil)

	return project, nil
}

func (s *ProjectService) GetAll(userID, organizationID uuid.UUID) ([]models.Project, error) {
	return s.projectRepo.GetAllByOrganization(userID, organizationID)
}

func (s *ProjectService) GetByID(id, userID, organizationID uuid.UUID) (*models.Project, error) {
	// Check if user is in the organization (Though middleware should catch this, it's a safe double-check)
	isInOrg, err := s.orgRepo.IsUserMember(organizationID, userID)
	if err != nil {
		return nil, err
	}
	if !isInOrg {
		return nil, errors.New("access denied: you are not a member of this organization")
	}

	// All organization members can view all organization projects
	return s.projectRepo.FindByIDAndOrganization(id, organizationID)
}

func (s *ProjectService) Update(id uuid.UUID, input UpdateProjectInput, userID, organizationID uuid.UUID) (*models.Project, error) {
	project, err := s.projectRepo.FindByIDAndOrganization(id, organizationID)
	if err != nil {
		return nil, err
	}

	// Check if user is owner or admin member
	if project.OwnerID != userID {
		// Could also check for 'admin' role in project_members, but owner is simplest for now
		return nil, errors.New("only project owner can update project settings")
	}

	oldData := map[string]interface{}{
		"name":        project.Name,
		"description": project.Description,
	}

	project.Name = input.Name
	project.Description = input.Description
	project.Icon = input.Icon
	project.Color = input.Color

	if err := s.projectRepo.Update(project); err != nil {
		return nil, err
	}

	newData := map[string]interface{}{
		"name":        project.Name,
		"description": project.Description,
	}

	changes := map[string]interface{}{
		"old": oldData,
		"new": newData,
	}

	s.logActivity(userID, &project.ID, nil, "updated", "project", project.ID, changes)

	return project, nil
}

func (s *ProjectService) Delete(id uuid.UUID, userID, organizationID uuid.UUID) error {
	project, err := s.projectRepo.FindByIDAndOrganization(id, organizationID)
	if err != nil {
		return err
	}

	// Check if user is owner
	if project.OwnerID != userID {
		return errors.New("only project owner can delete the project")
	}

	s.logActivity(userID, &project.ID, nil, "deleted", "project", project.ID, nil)

	return s.projectRepo.Delete(id)
}

func (s *ProjectService) AddMember(projectID, userID uuid.UUID, role string, addedBy, organizationID uuid.UUID) error {
	project, err := s.projectRepo.FindByIDAndOrganization(projectID, organizationID)
	if err != nil {
		return err
	}

	// Only owner can add members
	if project.OwnerID != addedBy {
		return errors.New("only project owner can add members")
	}

	// Verify the user being added is in the same organization
	isInOrg, err := s.orgRepo.IsUserMember(organizationID, userID)
	if err != nil {
		return err
	}
	if !isInOrg {
		return errors.New("cannot add user: user is not a member of this organization")
	}

	member := &models.ProjectMember{
		ProjectID: projectID,
		UserID:    userID,
		Role:      role,
	}

	if err := s.projectRepo.AddMember(member); err != nil {
		return err
	}

	changes := map[string]interface{}{
		"userId": userID,
		"role":   role,
	}

	s.logActivity(addedBy, &projectID, nil, "added_member", "project", projectID, changes)

	return nil
}

func (s *ProjectService) RemoveMember(projectID, userID, removedBy, organizationID uuid.UUID) error {
	project, err := s.projectRepo.FindByIDAndOrganization(projectID, organizationID)
	if err != nil {
		return err
	}

	// Only owner can remove members, but users can remove themselves
	if project.OwnerID != removedBy && userID != removedBy {
		return errors.New("only project owner can remove members")
	}

	if err := s.projectRepo.RemoveMember(projectID, userID); err != nil {
		return err
	}

	changes := map[string]interface{}{
		"userId": userID,
	}

	s.logActivity(removedBy, &projectID, nil, "removed_member", "project", projectID, changes)

	return nil
}

func (s *ProjectService) logActivity(userID uuid.UUID, projectID *uuid.UUID, issueID *uuid.UUID, action, entityType string, entityID uuid.UUID, changes map[string]interface{}) {
	changesJSON := ""
	if changes != nil {
		bytes, _ := json.Marshal(changes)
		changesJSON = string(bytes)
	}

	activity := &models.ActivityLog{
		UserID:     userID,
		ProjectID:  projectID,
		IssueID:    issueID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Changes:    changesJSON,
	}

	_ = s.activityRepo.Create(activity)
}
