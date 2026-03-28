package handlers

import (
	"errors"
	"log"

	"rex-backend/internal/database"
	"rex-backend/internal/setup"
	"github.com/gofiber/fiber/v2"
)

type SetupHandler struct {
	store         *setup.DBConfigStore
	preconfigured bool
}

func NewSetupHandler(store *setup.DBConfigStore, preconfigured bool) *SetupHandler {
	return &SetupHandler{store: store, preconfigured: preconfigured}
}

func (h *SetupHandler) GetStatus(c *fiber.Ctx) error {
	configured := h.preconfigured || h.store.IsConfigured()
	log.Printf("🔍 Setup check: configured=%v (pre=%v, file=%v)", configured, h.preconfigured, h.store.IsConfigured())
	return c.JSON(fiber.Map{
		"configured": configured,
	})
}

type saveDatabaseURLRequest struct {
	DatabaseURL string `json:"databaseUrl"`
	ShouldSeed  bool   `json:"shouldSeed"`
}

func (h *SetupHandler) SaveDatabaseURL(c *fiber.Ctx) error {
	var req saveDatabaseURLRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := setup.ValidateConnection(req.DatabaseURL); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.store.Save(req.DatabaseURL); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// 3. Seed if requested
	if req.ShouldSeed {
		// We need a DB connection to seed
		db, err := setup.GetDBConnection(req.DatabaseURL)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to connect for seeding: " + err.Error()})
		}
		// Run migrations first to ensure schema is ready
		if err := database.Migrate(db); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Migration failed: " + err.Error()})
		}
		if err := database.Seed(db); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Seeding failed: " + err.Error()})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":         "Database URL saved securely",
		"restartRequired": true,
	})
}

func (h *SetupHandler) LoadDatabaseURL() (string, error) {
	databaseURL, err := h.store.Load()
	if err != nil {
		if errors.Is(err, setup.ErrNotConfigured) {
			return "", nil
		}
		return "", err
	}

	return databaseURL, nil
}
