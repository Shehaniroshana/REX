package handlers

import (
	"encoding/csv"
	"fmt"
	"strconv"
	"time"

	"rex-backend/internal/middleware"
	"rex-backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ExportHandler struct {
	db *gorm.DB
}

func NewExportHandler(db *gorm.DB) *ExportHandler {
	return &ExportHandler{db: db}
}

// ExportIssues streams a CSV file of all issues in a project.
// GET /api/export/issues?projectId=<uuid>
func (h *ExportHandler) ExportIssues(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	projectIDStr := c.Query("projectId")
	if projectIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "projectId query parameter is required",
		})
	}

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	var project models.Project
	if err := h.db.First(&project, "id = ?", projectID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Project not found",
		})
	}

	// Verify the requesting user is the owner or a member of the project
	if project.OwnerID != userID {
		var memberCount int64
		h.db.Model(&models.ProjectMember{}).
			Where("project_id = ? AND user_id = ?", projectID, userID).
			Count(&memberCount)
		if memberCount == 0 {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You do not have access to this project",
			})
		}
	}

	var issues []models.Issue
	h.db.
		Preload("Assignee").
		Preload("Reporter").
		Preload("Sprint").
		Preload("Labels").
		Where("project_id = ?", projectID).
		Order("created_at ASC").
		Find(&issues)

	filename := fmt.Sprintf("%s-issues-%s.csv", project.Key, time.Now().Format("2006-01-02"))
	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	w := csv.NewWriter(c.Response().BodyWriter())

	// Write header
	_ = w.Write([]string{
		"Key", "Title", "Type", "Status", "Priority",
		"Assignee", "Reporter", "Sprint",
		"Story Points", "Estimated (min)", "Time Spent (min)",
		"Labels", "Created At", "Updated At",
	})

	for _, issue := range issues {
		assignee := ""
		if issue.Assignee != nil {
			assignee = issue.Assignee.FirstName + " " + issue.Assignee.LastName
		}

		reporter := issue.Reporter.FirstName + " " + issue.Reporter.LastName

		sprint := ""
		if issue.Sprint != nil {
			sprint = issue.Sprint.Name
		}

		storyPoints := ""
		if issue.StoryPoints != nil {
			storyPoints = strconv.Itoa(*issue.StoryPoints)
		}

		labels := ""
		for i, l := range issue.Labels {
			if i > 0 {
				labels += "; "
			}
			labels += l.Name
		}

		_ = w.Write([]string{
			issue.Key,
			issue.Title,
			issue.Type,
			issue.Status,
			issue.Priority,
			assignee,
			reporter,
			sprint,
			storyPoints,
			strconv.Itoa(issue.EstimatedTime),
			strconv.Itoa(issue.TimeSpent),
			labels,
			issue.CreatedAt.Format(time.RFC3339),
			issue.UpdatedAt.Format(time.RFC3339),
		})
	}

	w.Flush()
	return nil
}
