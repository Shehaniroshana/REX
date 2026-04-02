package repository

import (
	"rex-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrganizationRepository struct {
	db *gorm.DB
}

func NewOrganizationRepository(db *gorm.DB) *OrganizationRepository {
	return &OrganizationRepository{db: db}
}

func (r *OrganizationRepository) Create(org *models.Organization) error {
	return r.db.Create(org).Error
}

func (r *OrganizationRepository) FindByID(id uuid.UUID) (*models.Organization, error) {
	var org models.Organization
	err := r.db.First(&org, "id = ?", id).Error
	return &org, err
}

func (r *OrganizationRepository) Update(org *models.Organization) error {
	return r.db.Save(org).Error
}

func (r *OrganizationRepository) FindAllByUserID(userID uuid.UUID) ([]models.Organization, error) {
	var orgs []models.Organization
	err := r.db.Joins("JOIN organization_members on organization_members.organization_id = organizations.id").
		Where("organization_members.user_id = ? AND organization_members.deleted_at IS NULL", userID).
		Find(&orgs).Error
	return orgs, err
}

func (r *OrganizationRepository) Delete(orgID uuid.UUID) error {
	return r.db.Delete(&models.Organization{}, "id = ?", orgID).Error
}

func (r *OrganizationRepository) GetMembersByOrganizationID(orgID uuid.UUID, roleFilter, search string) ([]models.OrganizationMember, error) {
	var members []models.OrganizationMember
	query := r.db.Preload("User").Where("organization_id = ?", orgID)

	if roleFilter != "" {
		query = query.Where("role = ?", roleFilter)
	}

	if search != "" {
		query = query.Joins("JOIN users ON users.id = organization_members.user_id").
			Where("users.email LIKE ? OR users.first_name LIKE ? OR users.last_name LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	err := query.Find(&members).Error
	return members, err
}

func (r *OrganizationRepository) AddMember(member *models.OrganizationMember) error {
	return r.db.Create(member).Error
}

func (r *OrganizationRepository) IsUserMember(orgID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.OrganizationMember{}).
		Where("organization_id = ? AND user_id = ?", orgID, userID).
		Count(&count).Error
	return count > 0, err
}

func (r *OrganizationRepository) GetMember(orgID, userID uuid.UUID) (*models.OrganizationMember, error) {
	var member models.OrganizationMember
	err := r.db.Where("organization_id = ? AND user_id = ?", orgID, userID).First(&member).Error
	return &member, err
}

func (r *OrganizationRepository) CountAdmins(orgID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.OrganizationMember{}).
		Where("organization_id = ? AND role = 'admin'", orgID).
		Count(&count).Error
	return count, err
}

func (r *OrganizationRepository) UpdateMemberRole(orgID, userID uuid.UUID, role string) error {
	return r.db.Model(&models.OrganizationMember{}).
		Where("organization_id = ? AND user_id = ?", orgID, userID).
		Update("role", role).Error
}

func (r *OrganizationRepository) RemoveMember(orgID, userID uuid.UUID) error {
	return r.db.Where("organization_id = ? AND user_id = ?", orgID, userID).
		Delete(&models.OrganizationMember{}).Error
}

func (r *OrganizationRepository) FindByInviteCode(code string) (*models.Organization, error) {
	var org models.Organization
	err := r.db.Where("invite_code = ?", code).First(&org).Error
	return &org, err
}
