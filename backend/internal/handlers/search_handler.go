package handlers

import (
	"strings"

	"rex-backend/internal/middleware"
	"rex-backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SearchHandler struct {
	db *gorm.DB
}

func NewSearchHandler(db *gorm.DB) *SearchHandler {
	return &SearchHandler{db: db}
}

// escapeLikePattern escapes SQL LIKE special characters (%, _, \) in a search query
// to prevent users from inadvertently (or deliberately) altering the search semantics.
func escapeLikePattern(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `%`, `\%`)
	s = strings.ReplaceAll(s, `_`, `\_`)
	return s
}

type SearchResult struct {
	Issues   []models.Issue   `json:"issues"`
	Projects []models.Project `json:"projects"`
}

// Search performs a global search across issues and projects accessible to the user.
// GET /api/search?q=<query>&limit=<n>
func (h *SearchHandler) Search(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	query := c.Query("q")
	if query == "" {
		return c.JSON(SearchResult{Issues: []models.Issue{}, Projects: []models.Project{}})
	}

	limit := c.QueryInt("limit", 10)
	if limit < 1 || limit > 50 {
		limit = 10
	}

	pattern := "%" + escapeLikePattern(query) + "%"

	// Find projects the user owns or is a member of
	var memberProjectIDs []uuid.UUID
	h.db.Model(&models.ProjectMember{}).
		Select("project_id").
		Where("user_id = ?", userID).
		Pluck("project_id", &memberProjectIDs)

	var ownerProjectIDs []uuid.UUID
	h.db.Model(&models.Project{}).
		Select("id").
		Where("owner_id = ?", userID).
		Pluck("id", &ownerProjectIDs)

	// Merge project IDs (deduplicated via a map)
	seen := make(map[uuid.UUID]struct{})
	var accessibleProjectIDs []uuid.UUID
	for _, id := range append(memberProjectIDs, ownerProjectIDs...) {
		if _, ok := seen[id]; !ok {
			seen[id] = struct{}{}
			accessibleProjectIDs = append(accessibleProjectIDs, id)
		}
	}

	result := SearchResult{
		Issues:   []models.Issue{},
		Projects: []models.Project{},
	}

	if len(accessibleProjectIDs) == 0 {
		return c.JSON(result)
	}

	// Search projects
	h.db.
		Where("id IN ? AND (name ILIKE ? OR key ILIKE ? OR description ILIKE ?)",
			accessibleProjectIDs, pattern, pattern, pattern).
		Limit(limit).
		Find(&result.Projects)

	// Search issues within accessible projects
	h.db.
		Preload("Assignee").
		Preload("Reporter").
		Preload("Project").
		Where("project_id IN ? AND (title ILIKE ? OR key ILIKE ? OR description ILIKE ?)",
			accessibleProjectIDs, pattern, pattern, pattern).
		Order("updated_at DESC").
		Limit(limit).
		Find(&result.Issues)

	return c.JSON(result)
}
