package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"rex-backend/internal/config"
	"rex-backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	var (
		db  *gorm.DB
		err error
	)

	switch cfg.DBDriver {
	case "sqlite":
		dbPath := cfg.DBPath
		if dbPath == "" {
			dbPath = "./rex.db"
		}

		if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil && filepath.Dir(dbPath) != "." {
			return nil, fmt.Errorf("failed to create sqlite database directory: %w", err)
		}

		db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	default:
		dsn := cfg.DBURL
		if dsn == "" {
			dsn = fmt.Sprintf(
				"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
				cfg.DBHost,
				cfg.DBPort,
				cfg.DBUser,
				cfg.DBPassword,
				cfg.DBName,
				cfg.DBSSLMode,
			)
		}

	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		PrepareStmt: true,
	})
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("✅ Database connected successfully")
	return db, nil
}

func Migrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Ensure we are using a clean session for migrations
	tx := db.Session(&gorm.Session{
		AllowGlobalUpdate: false,
		PrepareStmt:       false,
	})

	err := tx.AutoMigrate(
		&models.User{},
		&models.Project{},
		&models.ProjectMember{},
		&models.Sprint{},
		&models.Issue{},
		&models.Comment{},
		&models.Attachment{},
		&models.ActivityLog{},
		&models.Label{},
		&models.WorkLog{},
		&models.Notification{},
		&models.IssueLink{},
	)

	if err != nil {
		log.Printf("❌ Migration error details: %+v", err)
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("✅ Database migrations completed successfully")
	return nil
}
