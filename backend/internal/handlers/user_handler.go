package handlers

import (
	"rex-backend/internal/middleware"
	"rex-backend/internal/repository"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler(userRepo *repository.UserRepository) *UserHandler {
	return &UserHandler{
		userRepo: userRepo,
	}
}

// GetAllUsers returns all users (for user selection dropdowns)
func (h *UserHandler) GetAllUsers(c *fiber.Ctx) error {
	users, err := h.userRepo.FindAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch users",
		})
	}

	return c.JSON(users)
}

// GetUserByID returns a specific user
func (h *UserHandler) GetUserByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	user, err := h.userRepo.FindByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	return c.JSON(user)
}

// SearchUsers searches users by email or name
func (h *UserHandler) SearchUsers(c *fiber.Ctx) error {
	query := c.Query("q")

	users, err := h.userRepo.Search(query)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to search users",
		})
	}

	return c.JSON(users)
}

type UpdateProfileInput struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Avatar    string `json:"avatar"`
}

// UpdateMe updates the authenticated user's own profile fields.
// PUT /api/users/me
func (h *UserHandler) UpdateMe(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	var input UpdateProfileInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.FirstName != "" {
		trimmed := strings.TrimSpace(input.FirstName)
		if trimmed == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "First name cannot be blank",
			})
		}
		user.FirstName = trimmed
	}
	if input.LastName != "" {
		trimmed := strings.TrimSpace(input.LastName)
		if trimmed == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Last name cannot be blank",
			})
		}
		user.LastName = trimmed
	}
	if input.Avatar != "" {
		user.Avatar = input.Avatar
	}

	if err := h.userRepo.Update(user); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update profile",
		})
	}

	return c.JSON(user)
}
