package handlers

import (
	"rex-backend/internal/middleware"
	"rex-backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type OrganizationHandler struct {
	orgService *services.OrganizationService
}

func NewOrganizationHandler(orgService *services.OrganizationService) *OrganizationHandler {
	return &OrganizationHandler{orgService: orgService}
}

func (h *OrganizationHandler) GetMyOrgs(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	orgs, err := h.orgService.GetAllForUser(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch organizations"})
	}
	return c.JSON(orgs)
}

func (h *OrganizationHandler) CreateOrg(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}
	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	org, err := h.orgService.CreateOrganization(input.Name, input.Description, userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(org)
}

func (h *OrganizationHandler) JoinByInviteCode(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}
	var input struct {
		InviteCode string `json:"inviteCode"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	org, err := h.orgService.JoinByInviteCode(input.InviteCode, userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(org)
}

func (h *OrganizationHandler) GetOrg(c *fiber.Ctx) error {
	orgID, err := middleware.GetOrgID(c)
	if err != nil {
		return err
	}
	org, err := h.orgService.GetByID(orgID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Organization not found"})
	}
	return c.JSON(org)
}

func (h *OrganizationHandler) UpdateOrg(c *fiber.Ctx) error {
	orgID, err := middleware.GetOrgID(c)
	if err != nil {
		return err
	}
	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	org, err := h.orgService.Update(orgID, input.Name, input.Description)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(org)
}

func (h *OrganizationHandler) DeleteOrg(c *fiber.Ctx) error {
	orgID, err := middleware.GetOrgID(c)
	if err != nil {
		return err
	}
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}
	if err := h.orgService.Delete(orgID, userID); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}

func (h *OrganizationHandler) GetMembers(c *fiber.Ctx) error {
	orgID, err := middleware.GetOrgID(c)
	if err != nil {
		return err
	}
	roleFilter := c.Query("role")
	search := c.Query("search")
	members, err := h.orgService.GetMembers(orgID, roleFilter, search)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch members"})
	}
	return c.JSON(members)
}

func (h *OrganizationHandler) InviteMember(c *fiber.Ctx) error {
	orgID, err := middleware.GetOrgID(c)
	if err != nil {
		return err
	}
	var input struct {
		Email string `json:"email"`
		Role  string `json:"role"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	member, err := h.orgService.InviteMember(orgID, input.Email, input.Role)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(member)
}

func (h *OrganizationHandler) UpdateMemberRole(c *fiber.Ctx) error {
	orgID, err := middleware.GetOrgID(c)
	if err != nil {
		return err
	}
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}
	targetIDStr := c.Params("userId")
	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}
	var input struct {
		Role string `json:"role"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	if err := h.orgService.UpdateMemberRole(orgID, userID, targetID, input.Role); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(200)
}

func (h *OrganizationHandler) RemoveMember(c *fiber.Ctx) error {
	orgID, err := middleware.GetOrgID(c)
	if err != nil {
		return err
	}
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}
	targetIDStr := c.Params("userId")
	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid target user ID"})
	}
	// Admin can remove themselves (leave) or others, handled in service.
	if err := h.orgService.RemoveMember(orgID, userID, targetID); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}

func (h *OrganizationHandler) RegenerateInviteCode(c *fiber.Ctx) error {
	orgID, err := middleware.GetOrgID(c)
	if err != nil {
		return err
	}
	code, err := h.orgService.RegenerateInviteCode(orgID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"inviteCode": code})
}
