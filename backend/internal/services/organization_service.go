package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"rex-backend/internal/models"
	"rex-backend/internal/repository"
)

type OrganizationService struct {
	orgRepo  *repository.OrganizationRepository
	userRepo *repository.UserRepository
}

func NewOrganizationService(orgRepo *repository.OrganizationRepository, userRepo *repository.UserRepository) *OrganizationService {
	return &OrganizationService{
		orgRepo:  orgRepo,
		userRepo: userRepo,
	}
}

func generateSlug(name string) string {
	slug := strings.ToLower(name)
	re := regexp.MustCompile(`[^a-z0-9]+`)
	slug = re.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	return slug + "-" + uuid.New().String()[:6]
}

func generateInviteCode() (string, error) {
	bytes := make([]byte, 8) // 16 hex chars
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// CreateOrganization creates a new org owned by createdBy and makes them admin.
func (s *OrganizationService) CreateOrganization(name, description string, createdBy uuid.UUID) (*models.Organization, error) {
	if name == "" {
		return nil, errors.New("organization name is required")
	}

	slug := generateSlug(name)
	inviteCode, err := generateInviteCode()
	if err != nil {
		return nil, err
	}

	org := &models.Organization{
		Name:        name,
		Slug:        slug,
		Description: description,
		InviteCode:  inviteCode,
		CreatedBy:   createdBy,
	}

	if err := s.orgRepo.Create(org); err != nil {
		return nil, err
	}

	if err := s.orgRepo.AddMember(&models.OrganizationMember{
		OrganizationID: org.ID,
		UserID:         createdBy,
		Role:           "admin",
	}); err != nil {
		return nil, err
	}

	return org, nil
}

// GetByID returns an organization by ID.
func (s *OrganizationService) GetByID(id uuid.UUID) (*models.Organization, error) {
	return s.orgRepo.FindByID(id)
}

// GetAllForUser returns all orgs the user belongs to.
func (s *OrganizationService) GetAllForUser(userID uuid.UUID) ([]models.Organization, error) {
	return s.orgRepo.FindAllByUserID(userID)
}

// Update updates the org's name and/or description. Caller must be org admin (enforced in handler via middleware).
func (s *OrganizationService) Update(orgID uuid.UUID, name, description string) (*models.Organization, error) {
	org, err := s.orgRepo.FindByID(orgID)
	if err != nil {
		return nil, errors.New("organization not found")
	}
	if name != "" {
		org.Name = name
	}
	if description != "" {
		org.Description = description
	}
	if err := s.orgRepo.Update(org); err != nil {
		return nil, err
	}
	return org, nil
}

// Delete soft-deletes an org. Only the creator/admin can do this.
func (s *OrganizationService) Delete(orgID, callerID uuid.UUID) error {
	isAdmin, err := s.IsAdminInOrganization(orgID, callerID)
	if err != nil {
		return err
	}
	if !isAdmin {
		return errors.New("only organization admins can delete the organization")
	}
	return s.orgRepo.Delete(orgID)
}

// GetMembers returns all members with optional role filter and search.
func (s *OrganizationService) GetMembers(orgID uuid.UUID, roleFilter, search string) ([]models.OrganizationMember, error) {
	return s.orgRepo.GetMembersByOrganizationID(orgID, roleFilter, search)
}

// InviteMember adds an existing user (by email) to the org.
func (s *OrganizationService) InviteMember(orgID uuid.UUID, email, role string) (*models.OrganizationMember, error) {
	if role == "" {
		role = "member"
	}
	if role != "admin" && role != "member" {
		return nil, errors.New("role must be 'admin' or 'member'")
	}

	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return nil, errors.New("no user found with that email address")
	}

	// Check if already a member
	isMember, _ := s.orgRepo.IsUserMember(orgID, user.ID)
	if isMember {
		return nil, errors.New("user is already a member of this organization")
	}

	member := &models.OrganizationMember{
		OrganizationID: orgID,
		UserID:         user.ID,
		Role:           role,
	}
	if err := s.orgRepo.AddMember(member); err != nil {
		return nil, err
	}

	// Preload user for the response
	member.User = *user
	return member, nil
}

// UpdateMemberRole changes a member's role within the org.
func (s *OrganizationService) UpdateMemberRole(orgID, callerID, targetUserID uuid.UUID, newRole string) error {
	if newRole != "admin" && newRole != "member" {
		return errors.New("role must be 'admin' or 'member'")
	}

	// Prevent removing the last admin
	if newRole == "member" {
		adminCount, err := s.orgRepo.CountAdmins(orgID)
		if err != nil {
			return err
		}
		currentMember, err := s.orgRepo.GetMember(orgID, targetUserID)
		if err != nil {
			return errors.New("member not found")
		}
		if currentMember.Role == "admin" && adminCount <= 1 {
			return errors.New("cannot demote the last admin of the organization")
		}
	}

	return s.orgRepo.UpdateMemberRole(orgID, targetUserID, newRole)
}

// RemoveMember removes a member from the org. Can be called by org admin or the member themselves.
func (s *OrganizationService) RemoveMember(orgID, callerID, targetUserID uuid.UUID) error {
	// Prevent removing the last admin
	targetMember, err := s.orgRepo.GetMember(orgID, targetUserID)
	if err != nil {
		return errors.New("member not found in this organization")
	}
	if targetMember.Role == "admin" {
		adminCount, err := s.orgRepo.CountAdmins(orgID)
		if err != nil {
			return err
		}
		if adminCount <= 1 {
			return errors.New("cannot remove the last admin of the organization")
		}
	}
	return s.orgRepo.RemoveMember(orgID, targetUserID)
}

// IsAdminInOrganization checks if the given user is an admin of the org.
func (s *OrganizationService) IsAdminInOrganization(orgID, userID uuid.UUID) (bool, error) {
	member, err := s.orgRepo.GetMember(orgID, userID)
	if err != nil {
		return false, err
	}
	return member.Role == "admin", nil
}

// JoinByInviteCode allows a user to join an org using its invite code.
func (s *OrganizationService) JoinByInviteCode(code string, userID uuid.UUID) (*models.Organization, error) {
	org, err := s.orgRepo.FindByInviteCode(code)
	if err != nil {
		return nil, errors.New("invalid invite code")
	}

	isMember, _ := s.orgRepo.IsUserMember(org.ID, userID)
	if isMember {
		return org, nil // idempotent
	}

	if err := s.orgRepo.AddMember(&models.OrganizationMember{
		OrganizationID: org.ID,
		UserID:         userID,
		Role:           "member",
	}); err != nil {
		return nil, err
	}

	return org, nil
}

// RegenerateInviteCode creates a new invite code for the org.
func (s *OrganizationService) RegenerateInviteCode(orgID uuid.UUID) (string, error) {
	org, err := s.orgRepo.FindByID(orgID)
	if err != nil {
		return "", errors.New("organization not found")
	}
	code, err := generateInviteCode()
	if err != nil {
		return "", err
	}
	org.InviteCode = code
	if err := s.orgRepo.Update(org); err != nil {
		return "", err
	}
	return code, nil
}
