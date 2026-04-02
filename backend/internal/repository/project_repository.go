package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"rex-backend/internal/models"
)

type ProjectRepository struct {
	db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

func (r *ProjectRepository) Create(project *models.Project) error {
	return r.db.Create(project).Error
}

func (r *ProjectRepository) FindByID(id uuid.UUID) (*models.Project, error) {
	var project models.Project
	err := r.db.
		Preload("Organization").
		Preload("Owner").
		Preload("Members.User").
		First(&project, "id = ?", id).Error
	return &project, err
}

func (r *ProjectRepository) FindByIDAndOrganization(id, organizationID uuid.UUID) (*models.Project, error) {
	var project models.Project
	err := r.db.
		Preload("Organization").
		Preload("Owner").
		Preload("Members.User").
		First(&project, "id = ? AND organization_id = ?", id, organizationID).Error
	return &project, err
}

func (r *ProjectRepository) FindByKeyInOrganization(key string, organizationID uuid.UUID) (*models.Project, error) {
	var project models.Project
	err := r.db.Where("key = ? AND organization_id = ?", key, organizationID).First(&project).Error
	return &project, err
}

func (r *ProjectRepository) FindByKey(key string) (*models.Project, error) {
	var project models.Project
	err := r.db.Where("key = ?", key).First(&project).Error
	return &project, err
}

func (r *ProjectRepository) GetAllByOrganization(userID, organizationID uuid.UUID) ([]models.Project, error) {
	var projects []models.Project
	// Return ALL projects in the organization - any organization member can view all org projects
	err := r.db.
		Preload("Organization").
		Preload("Owner").
		Preload("Members").
		Where("organization_id = ?", organizationID).
		Find(&projects).Error
	return projects, err
}

func (r *ProjectRepository) FindAll() ([]models.Project, error) {
	var projects []models.Project
	err := r.db.
		Preload("Organization").
		Preload("Owner").
		Preload("Members.User").
		Find(&projects).Error
	return projects, err
}

func (r *ProjectRepository) Update(project *models.Project) error {
	return r.db.Save(project).Error
}

func (r *ProjectRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Project{}, "id = ?", id).Error
}

func (r *ProjectRepository) AddMember(member *models.ProjectMember) error {
	return r.db.Create(member).Error
}

func (r *ProjectRepository) RemoveMember(projectID, userID uuid.UUID) error {
	return r.db.Delete(&models.ProjectMember{}, "project_id = ? AND user_id = ?", projectID, userID).Error
}

func (r *ProjectRepository) GetMembers(projectID uuid.UUID) ([]models.ProjectMember, error) {
	var members []models.ProjectMember
	err := r.db.Preload("User").Where("project_id = ?", projectID).Find(&members).Error
	return members, err
}

func (r *ProjectRepository) IsMember(projectID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.ProjectMember{}).
		Where("project_id = ? AND user_id = ?", projectID, userID).
		Count(&count).Error
	return count > 0, err
}

func (r *ProjectRepository) IncrementNextIssueNumber(tx *gorm.DB, projectID uuid.UUID) (int, error) {
	var project models.Project
	if err := tx.Model(&project).
		Where("id = ?", projectID).
		UpdateColumn("next_issue_number", gorm.Expr("next_issue_number + 1")).
		First(&project, "id = ?", projectID).Error; err != nil {
		return 0, err
	}
	return project.NextIssueNumber - 1, nil // Return current before incrementing (or handle as you prefer)
}
