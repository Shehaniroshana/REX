package main

import (
	"log"

	"rex-backend/internal/config"
	"rex-backend/internal/database"
)

func main() {
	// 1. Load configuration
	cfg := config.LoadConfig()

	// 2. Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	// 3. Run migrations (to ensure schema exists)
	if err := database.Migrate(db); err != nil {
		log.Fatalf("❌ Failed to run migrations: %v", err)
	}

	// 4. Run seeds
	if err := database.Seed(db); err != nil {
		log.Fatalf("❌ Failed to seed database: %v", err)
	}

	log.Println("✅ Database seeded successfully!")
}
