package middleware

import (
	"rex-backend/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func OrgMemberMiddleware(orgRepo *repository.OrganizationRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		orgIdStr := c.Params("orgId")
		if orgIdStr == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing orgId parameter"})
		}
		orgId, err := uuid.Parse(orgIdStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid orgId format"})
		}

		userId, err := GetUserID(c)
		if err != nil {
			return err
		}

		member, err := orgRepo.GetMember(orgId, userId)
		if err != nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Access denied. You are not a member of this organization."})
		}

		c.Locals("orgId", orgId)
		c.Locals("orgRole", member.Role)
		return c.Next()
	}
}

func OrgAdminMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("orgRole")
		if role != "admin" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Admin access required"})
		}
		return c.Next()
	}
}

func GetOrgID(c *fiber.Ctx) (uuid.UUID, error) {
	orgID := c.Locals("orgId")
	if orgID == nil {
		return uuid.Nil, fiber.NewError(fiber.StatusInternalServerError, "Organization ID not found in context")
	}
	return orgID.(uuid.UUID), nil
}
