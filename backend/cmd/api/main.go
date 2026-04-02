package main

import (
	"log"
	"os"

	"rex-backend/internal/config"
	"rex-backend/internal/database"
	"rex-backend/internal/handlers"
	"rex-backend/internal/middleware"
	"rex-backend/internal/repository"
	"rex-backend/internal/services"
	"rex-backend/internal/setup"
	"rex-backend/internal/websocket"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	websocketMiddleware "github.com/gofiber/websocket/v2"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

func main() {
	// 1. Load configuration basics
	cfg := config.LoadConfig()
	store := setup.NewDBConfigStore(cfg.DBConfigPath, cfg.DBKeyPath)

	// 2. Try to load encrypted DB URL
	if cfg.DBURL == "" {
		databaseURL, err := store.Load()
		if err == nil && databaseURL != "" {
			cfg.DBURL = databaseURL
		}
	}

	// 3. Create Fiber app early to allow configuration routes even if DB fails
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
		Prefork:       false,
		StrictRouting: false,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Static("/uploads", "./uploads")

	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, Connection, Upgrade, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Extensions",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS, UPGRADE",
		AllowCredentials: true,
		ExposeHeaders:    "Sec-WebSocket-Accept, Sec-WebSocket-Protocol, Sec-WebSocket-Version",
	}))

	// API global group
	api := app.Group("/api")

	// 4. Initialize WebSocket hub early (Always available)
	hub := websocket.NewHub()
	go hub.Run()

	// 5. Conditional Backend Initialization
	var dbConnected bool
	if cfg.DBURL != "" || cfg.DBHost != "" || cfg.DBPath != "" {
		db, err := database.Connect(cfg)
		if err == nil {
			// Run migrations
			if err := database.Migrate(db); err == nil {
				dbConnected = true
				setupFullAPI(api, db, cfg, hub)
			} else {
				log.Println("⚠️  Database migration failed:", err)
			}
		} else {
			log.Println("⚠️  Database connection failed. Please visit /setup to configure your database.")
		}
	} else {
		log.Println("🔌 Database not configured. Running in Setup Mode.")
	}

	// Setup Handler (Always accessible, outside of any potentially protected groups)
	setupHandler := handlers.NewSetupHandler(store, dbConnected)
	app.Get("/api/setup/status", setupHandler.GetStatus)

	// After a successful setup save the backend shuts down gracefully so that
	// the process manager (our new while loop / Electron / concurrently) restarts
	// it with the full API routes (including /api/auth/login) loaded from the store.
	app.Post("/api/setup/database-url", func(c *fiber.Ctx) error {
		if err := setupHandler.SaveDatabaseURL(c); err != nil {
			return err
		}

		// Fiber's c.Status().JSON() returns nil error. We must check the actual status code set.
		if c.Response().StatusCode() >= 400 {
			return nil
		}

		go func() {
			log.Println("✅ Setup complete — restarting backend to activate full API...")
			_ = app.Shutdown()
			os.Exit(0) // Clean exit so the shell loop restarts us
		}()
		return nil
	})

	// 6. WebSocket route (Always available at /api/ws)
	api.Get("/ws", websocketMiddleware.New(func(c *websocketMiddleware.Conn) {
		log.Println("WebSocket upgrade request received")
		token := c.Query("token")
		if token == "" {
			log.Println("WebSocket: No token provided")
			c.WriteMessage(websocketMiddleware.TextMessage, []byte(`{"type":"error","data":{"message":"No authentication token"}}`))
			c.Close()
			return
		}

		// Validate token at handshake time to prevent unauthenticated socket sessions.
		parsedToken, err := jwt.ParseWithClaims(token, &middleware.Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})
		if err != nil || !parsedToken.Valid {
			log.Printf("WebSocket: Invalid token: %v", err)
			c.WriteMessage(websocketMiddleware.TextMessage, []byte(`{"type":"error","data":{"message":"Invalid or expired token"}}`))
			c.Close()
			return
		}

		log.Println("WebSocket: Token received, establishing connection")
		websocket.HandleConnection(hub, c, token, cfg.JWTSecret)
	}, websocketMiddleware.Config{
		// Allow dev browser + Electron origins for WS upgrades.
		Origins: []string{"*"},
	}))

	// Health check (always available) — frontend can poll this after restart
	app.Get("/health", func(c *fiber.Ctx) error {
		status := "setup_required"
		if dbConnected {
			status = "ok"
		}
		return c.JSON(fiber.Map{"status": status, "dbConnected": dbConnected})
	})

	// 5. Start server
	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 REX Server starting on port %s", port)
	if !dbConnected {
		log.Println("🚦 NOTE: Server is running in SETUP MODE only.")
	}

	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

// setupFullAPI handles the full app initialization once DB is ready
func setupFullAPI(api fiber.Router, db *gorm.DB, cfg *config.Config, hub *websocket.Hub) {
	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	organizationRepo := repository.NewOrganizationRepository(db)
	issueRepo := repository.NewIssueRepository(db)
	sprintRepo := repository.NewSprintRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	activityRepo := repository.NewActivityRepository(db)
	labelRepo := repository.NewLabelRepository(db)
	workLogRepo := repository.NewWorkLogRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)

	// Notification service uses the shared hub

	// Initialize services
	authService := services.NewAuthService(userRepo, organizationRepo, cfg.JWTSecret)
	projectService := services.NewProjectService(projectRepo, activityRepo, organizationRepo)
	notificationService := services.NewNotificationService(notificationRepo, hub)
	issueService := services.NewIssueService(issueRepo, projectRepo, activityRepo, notificationService)
	sprintService := services.NewSprintService(sprintRepo, activityRepo, issueRepo)
	commentService := services.NewCommentService(commentRepo, activityRepo)
	labelService := services.NewLabelService(labelRepo, projectRepo)
	workLogService := services.NewWorkLogService(workLogRepo, issueRepo)
	attachmentService := services.NewAttachmentService(db, "./uploads", activityRepo)
	issueLinkService := services.NewIssueLinkService(db)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userRepo)
	projectHandler := handlers.NewProjectHandler(projectService)
	issueHandler := handlers.NewIssueHandler(issueService)
	sprintHandler := handlers.NewSprintHandler(sprintService)
	commentHandler := handlers.NewCommentHandler(commentService)
	labelHandler := handlers.NewLabelHandler(labelService)
	workLogHandler := handlers.NewWorkLogHandler(workLogService)
	subtaskHandler := handlers.NewSubtaskHandler(issueService)
	attachmentHandler := handlers.NewAttachmentHandler(attachmentService, "./uploads")
	activityHandler := handlers.NewActivityHandler(db)
	notificationHandler := handlers.NewNotificationHandler(notificationService)
	reportHandler := handlers.NewReportHandler(db)
	issueLinkHandler := handlers.NewIssueLinkHandler(issueLinkService)
	organizationService := services.NewOrganizationService(organizationRepo, userRepo)
	organizationHandler := handlers.NewOrganizationHandler(organizationService)
	adminHandler := handlers.NewAdminHandler(userRepo, projectRepo, authService)

	// Auth routes
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Get("/me", middleware.Protected(cfg.JWTSecret), authHandler.GetMe)

	// Protected routes
	protected := api.Group("", middleware.Protected(cfg.JWTSecret))

	// User routes
	users := protected.Group("/users")
	users.Get("/", userHandler.GetAllUsers)
	users.Get("/search", userHandler.SearchUsers)
	users.Get("/:id", userHandler.GetUserByID)

	// Organization top-level routes and global org routes
	orgs := protected.Group("/orgs")
	orgs.Get("/", organizationHandler.GetMyOrgs)
	orgs.Post("/", organizationHandler.CreateOrg)
	orgs.Post("/join", organizationHandler.JoinByInviteCode)

	// Organization scoped routes
	orgScoped := orgs.Group("/:orgId", middleware.OrgMemberMiddleware(organizationRepo))
	orgScoped.Get("/", organizationHandler.GetOrg)
	orgScoped.Patch("/", middleware.OrgAdminMiddleware(), organizationHandler.UpdateOrg)
	orgScoped.Delete("/", middleware.OrgAdminMiddleware(), organizationHandler.DeleteOrg)

	// Organization Members
	orgScoped.Get("/members", organizationHandler.GetMembers)
	orgScoped.Post("/members", middleware.OrgAdminMiddleware(), organizationHandler.InviteMember)
	orgScoped.Patch("/members/:userId", middleware.OrgAdminMiddleware(), organizationHandler.UpdateMemberRole)
	orgScoped.Delete("/members/:userId", organizationHandler.RemoveMember)
	orgScoped.Post("/invite-code/regenerate", middleware.OrgAdminMiddleware(), organizationHandler.RegenerateInviteCode)

	// Project routes (scoped under organization for multi-tenant support)
	projects := orgScoped.Group("/projects")
	projects.Get("/", projectHandler.GetAll)
	projects.Post("/", projectHandler.Create)
	projects.Get("/:id", projectHandler.GetByID)
	projects.Put("/:id", projectHandler.Update)
	projects.Delete("/:id", projectHandler.Delete)
	projects.Get("/:id/members", projectHandler.GetMembers)
	projects.Post("/:id/members", projectHandler.AddMember)
	projects.Put("/:id/members/:userId", projectHandler.UpdateMemberRole)
	projects.Delete("/:id/members/:userId", projectHandler.RemoveMember)

	// Issue routes
	issues := protected.Group("/issues")
	issues.Get("/project/:projectId", issueHandler.GetByProject)
	issues.Post("/", issueHandler.Create)
	issues.Get("/:id", issueHandler.GetByID)
	issues.Put("/:id", issueHandler.Update)
	issues.Delete("/:id", issueHandler.Delete)

	// Sprint routes
	sprints := protected.Group("/sprints")
	sprints.Get("/project/:projectId", sprintHandler.GetByProject)
	sprints.Post("/", sprintHandler.Create)
	sprints.Get("/:id", sprintHandler.GetByID)
	sprints.Put("/:id", sprintHandler.Update)
	sprints.Delete("/:id", sprintHandler.Delete)
	sprints.Post("/:id/start", sprintHandler.StartSprint)
	sprints.Post("/:id/complete", sprintHandler.CompleteSprint)

	// Comment routes
	comments := protected.Group("/comments")
	comments.Get("/issue/:issueId", commentHandler.GetByIssue)
	comments.Post("/", commentHandler.Create)
	comments.Put("/:id", commentHandler.Update)
	comments.Delete("/:id", commentHandler.Delete)

	// Label routes
	labels := protected.Group("/labels")
	labels.Get("/project/:projectId", labelHandler.GetLabelsByProject)
	labels.Post("/", labelHandler.CreateLabel)
	labels.Get("/:id", labelHandler.GetLabel)
	labels.Put("/:id", labelHandler.UpdateLabel)
	labels.Delete("/:id", labelHandler.DeleteLabel)
	labels.Get("/issue/:issueId", labelHandler.GetLabelsByIssue)
	labels.Post("/issue/:issueId", labelHandler.AddLabelToIssue)
	labels.Delete("/issue/:issueId/:labelId", labelHandler.RemoveLabelFromIssue)

	// Work log routes
	worklogs := protected.Group("/worklogs")
	worklogs.Get("/issue/:issueId", workLogHandler.GetWorkLogsByIssue)
	worklogs.Get("/user/me", workLogHandler.GetWorkLogsByUser)
	worklogs.Post("/", workLogHandler.CreateWorkLog)
	worklogs.Get("/:id", workLogHandler.GetWorkLog)
	worklogs.Put("/:id", workLogHandler.UpdateWorkLog)
	worklogs.Delete("/:id", workLogHandler.DeleteWorkLog)
	worklogs.Put("/issue/:issueId/estimate", workLogHandler.UpdateIssueEstimatedTime)
	worklogs.Get("/issue/:issueId/total", workLogHandler.GetTotalTimeSpent)
	worklogs.Get("/issue/:issueId/remaining", workLogHandler.GetRemainingTime)

	// Subtask routes
	subtasks := protected.Group("/subtasks")
	subtasks.Get("/issue/:issueId", subtaskHandler.GetSubtasks)
	subtasks.Post("/issue/:issueId", subtaskHandler.CreateSubtask)
	subtasks.Put("/:subtaskId/status", subtaskHandler.UpdateSubtaskStatus)
	subtasks.Delete("/:subtaskId", subtaskHandler.DeleteSubtask)
	subtasks.Get("/issue/:issueId/progress", subtaskHandler.GetSubtaskProgress)

	// Attachment routes
	attachments := protected.Group("/attachments")
	attachments.Post("/issue/:issueId", attachmentHandler.Upload)
	attachments.Delete("/:id", attachmentHandler.Delete)

	// Activity routes
	activities := protected.Group("/activity")
	activities.Get("/issue/:issueId", activityHandler.GetIssueActivity)
	activities.Get("/project/:projectId", activityHandler.GetProjectActivity)

	// Notification routes
	notifications := protected.Group("/notifications")
	notifications.Get("/", notificationHandler.GetMyNotifications)
	notifications.Put("/read-all", notificationHandler.MarkAllAsRead)
	notifications.Put("/:id/read", notificationHandler.MarkAsRead)
	notifications.Delete("/:id", notificationHandler.DeleteNotification)

	// Report routes
	reports := protected.Group("/reports")
	reports.Get("/project/:projectId/stats", reportHandler.GetProjectStats)
	reports.Get("/project/:projectId/trend", reportHandler.GetIssuesTrend)
	reports.Get("/project/:projectId/comprehensive", reportHandler.GetComprehensiveStats)
	reports.Get("/project/:projectId/team", reportHandler.GetTeamPerformance)
	reports.Get("/sprint/:sprintId/burndown", reportHandler.GetBurnDown)

	// Issue Link routes
	links := protected.Group("/links")
	links.Post("/", issueLinkHandler.CreateLink)
	links.Delete("/:id", issueLinkHandler.DeleteLink)
	links.Get("/issue/:issueId", issueLinkHandler.GetIssueLinks)

	// Admin routes (for system administrators)
	admin := protected.Group("/admin")
	admin.Get("/users", adminHandler.GetAllUsers)
	admin.Post("/users", adminHandler.CreateUser)
	admin.Put("/users/:id", adminHandler.UpdateUser)
	admin.Put("/users/:id/role", adminHandler.UpdateUserRole)
	admin.Put("/users/:id/password", adminHandler.ResetUserPassword)
	admin.Post("/users/:id/toggle-status", adminHandler.ToggleUserStatus)
	admin.Delete("/users/:id", adminHandler.DeleteUser)
	admin.Get("/stats/users", adminHandler.GetUserStats)
	admin.Get("/projects", adminHandler.GetAllProjects)
	admin.Post("/projects", adminHandler.CreateProject)
	admin.Put("/projects/:id", adminHandler.UpdateProject)
	admin.Delete("/projects/:id", adminHandler.DeleteProject)
	admin.Get("/stats/projects", adminHandler.GetProjectStats)

	// Workspace routes...
}
