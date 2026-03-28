package database

import (
	"fmt"
	"log"
	"time"

	"rex-backend/internal/models"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB) error {
	log.Println("Seeding database...")

	// 1. Create Users
	password, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	hashedPassword := string(password)

	users := []models.User{
		{
			ID:        uuid.New(),
			Email:     "admin@rex.com",
			Password:  hashedPassword,
			FirstName: "Admin",
			LastName:  "User",
			Role:      "admin",
			Avatar:    "https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff",
		},
		{
			ID:        uuid.New(),
			Email:     "shehan@rex.com",
			Password:  hashedPassword,
			FirstName: "Shehan",
			LastName:  "Iroshana",
			Role:      "user",
			Avatar:    "https://ui-avatars.com/api/?name=Shehan+Iroshana&background=10b981&color=fff",
		},
		{
			ID:        uuid.New(),
			Email:     "john@rex.com",
			Password:  hashedPassword,
			FirstName: "John",
			LastName:  "Doe",
			Role:      "user",
			Avatar:    "https://ui-avatars.com/api/?name=John+Doe&background=f59e0b&color=fff",
		},
		{
			ID:        uuid.New(),
			Email:     "jane@rex.com",
			Password:  hashedPassword,
			FirstName: "Jane",
			LastName:  "Smith",
			Role:      "user",
			Avatar:    "https://ui-avatars.com/api/?name=Jane+Smith&background=ec4899&color=fff",
		},
	}

	for i := range users {
		var existingUser models.User
		err := db.Model(&models.User{}).Where("email = ?", users[i].Email).First(&existingUser).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&users[i]).Error; err != nil {
					return fmt.Errorf("failed to create user %s: %w", users[i].Email, err)
				}
				log.Printf("Created user: %s (ID: %s)", users[i].Email, users[i].ID)
			} else {
				return fmt.Errorf("failed to check user %s: %w", users[i].Email, err)
			}
		} else {
			users[i] = existingUser
			log.Printf("Using existing user: %s (ID: %s)", users[i].Email, users[i].ID)
		}
	}

	// 2. Create Project
	project := models.Project{
		ID:          uuid.New(),
		Key:         "REX",
		Name:        "REX Jira Clone",
		Description: "A high-performance project management tool with glassmorphic UI.",
		OwnerID:     users[0].ID, // Admin is the owner
		Color:       "#6366f1",
		Icon:        "briefcase",
	}

	var pCount int64
	db.Model(&models.Project{}).Where("key = ?", project.Key).Count(&pCount)
	if pCount == 0 {
		if err := db.Create(&project).Error; err != nil {
			return fmt.Errorf("failed to create project: %w", err)
		}
		log.Printf("Created project: %s (ID: %s)", project.Key, project.ID)
	} else {
		var existingProject models.Project
		db.Where("key = ?", project.Key).First(&existingProject)
		project = existingProject
		log.Printf("Using existing project: %s (ID: %s)", project.Key, project.ID)
	}

	// 3. Add Project Members
	for i := range users {
		var mCount int64
		db.Model(&models.ProjectMember{}).Where("project_id = ? AND user_id = ?", project.ID, users[i].ID).Count(&mCount)
		if mCount == 0 {
			role := "member"
			if users[i].ID == project.OwnerID {
				role = "owner"
			}
			member := models.ProjectMember{
				ID:        uuid.New(),
				ProjectID: project.ID,
				UserID:    users[i].ID,
				Role:      role,
			}
			if err := db.Create(&member).Error; err != nil {
				return fmt.Errorf("failed to add member %s to project: %w", users[i].Email, err)
			}
			log.Printf("Added member %s to project REX", users[i].Email)
		}
	}

	// 4. Create Sprints
	now := time.Now()
	twoWeeksAgo := now.AddDate(0, 0, -14)
	twoWeeksFromNow := now.AddDate(0, 0, 14)

	sprints := []models.Sprint{
		{
			ID:        uuid.New(),
			ProjectID: project.ID,
			Name:      "Sprint 1 (Completed)",
			Goal:      "Initial setup and core features",
			StartDate: &twoWeeksAgo,
			EndDate:   &now,
			Status:    "completed",
		},
		{
			ID:        uuid.New(),
			ProjectID: project.ID,
			Name:      "Sprint 2 (Current)",
			Goal:      "Glassmorphic UI and Advanced Features",
			StartDate: &now,
			EndDate:   &twoWeeksFromNow,
			Status:    "active",
		},
		{
			ID:        uuid.New(),
			ProjectID: project.ID,
			Name:      "Sprint 3 (Future)",
			Goal:      "Performance optimization and Analytics",
			Status:    "planned",
		},
	}

	for i := range sprints {
		var existingSprint models.Sprint
		err := db.Model(&models.Sprint{}).Where("project_id = ? AND name = ?", project.ID, sprints[i].Name).First(&existingSprint).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&sprints[i]).Error; err != nil {
					return fmt.Errorf("failed to create sprint %s: %w", sprints[i].Name, err)
				}
				log.Printf("Created sprint: %s", sprints[i].Name)
			} else {
				return fmt.Errorf("failed to check sprint %s: %w", sprints[i].Name, err)
			}
		} else {
			sprints[i] = existingSprint
			log.Printf("Using existing sprint: %s", sprints[i].Name)
		}
	}

	// 5. Create Issues
	pMedium := "medium"
	pHigh := "high"
	pLow := "low"
	tTask := "task"
	tBug := "bug"
	tStory := "story"
	sTodo := "todo"
	sInProgress := "in_progress"
	sDone := "done"

	issues := []models.Issue{
		{
			ID:          uuid.New(),
			ProjectID:   project.ID,
			SprintID:    &sprints[0].ID,
			Key:         "REX-1",
			Title:       "Set up project structure",
			Description: "Create the initial folder structure for backend and frontend.",
			Status:      sDone,
			Type:        tTask,
			Priority:    pMedium,
			ReporterID:  users[0].ID,
			AssigneeID:  &users[1].ID,
			Position:    1,
		},
		{
			ID:          uuid.New(),
			ProjectID:   project.ID,
			SprintID:    &sprints[1].ID,
			Key:         "REX-2",
			Title:       "Design glassmorphic UI",
			Description: "Implement the modern glassmorphic theme across all components.",
			Status:      sInProgress,
			Type:        tStory,
			Priority:    pHigh,
			ReporterID:  users[1].ID,
			AssigneeID:  &users[0].ID,
			Position:    1,
		},
		{
			ID:          uuid.New(),
			ProjectID:   project.ID,
			SprintID:    &sprints[1].ID,
			Key:         "REX-3",
			Title:       "Fix login layout bug",
			Description: "The login form is not centered on mobile devices.",
			Status:      sTodo,
			Type:        tBug,
			Priority:    pHigh,
			ReporterID:  users[2].ID,
			AssigneeID:  &users[3].ID,
			Position:    2,
		},
		{
			ID:          uuid.New(),
			ProjectID:   project.ID,
			SprintID:    &sprints[1].ID,
			Key:         "REX-4",
			Title:       "Implement drag and drop for board",
			Description: "Allow users to move issues between columns using drag and drop.",
			Status:      sTodo,
			Type:        tStory,
			Priority:    pMedium,
			ReporterID:  users[0].ID,
			AssigneeID:  &users[2].ID,
			Position:    3,
		},
		{
			ID:          uuid.New(),
			ProjectID:   project.ID,
			SprintID:    nil, // Backlog
			Key:         "REX-5",
			Title:       "Add Dark Mode support",
			Description: "Users should be able to toggle between light and dark themes.",
			Status:      sTodo,
			Type:        tStory,
			Priority:    pLow,
			ReporterID:  users[3].ID,
			Position:    1,
		},
	}

	for _, issue := range issues {
		var existingIssue models.Issue
		err := db.Model(&models.Issue{}).Where("key = ?", issue.Key).First(&existingIssue).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&issue).Error; err != nil {
					return fmt.Errorf("failed to create issue %s: %w", issue.Key, err)
				}
				log.Printf("Created issue: %s", issue.Key)
			} else {
				return fmt.Errorf("failed to check issue %s: %w", issue.Key, err)
			}
		} else {
			// Update existing issue to point to the correct project and sprint
			existingIssue.ProjectID = issue.ProjectID
			existingIssue.SprintID = issue.SprintID
			existingIssue.Title = issue.Title
			existingIssue.Description = issue.Description
			existingIssue.Status = issue.Status
			existingIssue.Type = issue.Type
			existingIssue.Priority = issue.Priority
			existingIssue.ReporterID = issue.ReporterID
			existingIssue.AssigneeID = issue.AssigneeID
			existingIssue.Position = issue.Position

			if err := db.Save(&existingIssue).Error; err != nil {
				return fmt.Errorf("failed to update issue %s: %w", issue.Key, err)
			}
			log.Printf("Updated existing issue: %s to use project %s", issue.Key, project.ID)
		}
	}

	log.Println("✅ Seeding completed successfully")
	return nil
}
