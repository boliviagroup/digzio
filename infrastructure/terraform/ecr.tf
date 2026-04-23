# ============================================================
# ECR Repositories — Sprint 2
# ============================================================

resource "aws_ecr_repository" "auth_service" {
  name                 = "digzio/auth-service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "auth-service"
  }
}

resource "aws_ecr_repository" "property_api" {
  name                 = "digzio/property-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "property-api"
  }
}

resource "aws_ecr_repository" "image_api" {
  name                 = "digzio/image-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "image-api"
  }
}

resource "aws_ecr_repository" "notification_service" {
  name                 = "digzio/notification-service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "notification-service"
  }
}

# Lifecycle policy — keep last 10 images per repo
resource "aws_ecr_lifecycle_policy" "auth_service" {
  repository = aws_ecr_repository.auth_service.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "property_api" {
  repository = aws_ecr_repository.property_api.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "image_api" {
  repository = aws_ecr_repository.image_api.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "notification_service" {
  repository = aws_ecr_repository.notification_service.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

# ============================================================
# ECR Repositories — Sprint 3
# ============================================================

resource "aws_ecr_repository" "kyc_service" {
  name                 = "digzio/kyc-service"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  tags = { Project = "Digzio", Environment = "prod", Service = "kyc-service" }
}

resource "aws_ecr_repository" "application_service" {
  name                 = "digzio/application-service"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  tags = { Project = "Digzio", Environment = "prod", Service = "application-service" }
}

resource "aws_ecr_repository" "lease_service" {
  name                 = "digzio/lease-service"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  tags = { Project = "Digzio", Environment = "prod", Service = "lease-service" }
}

resource "aws_ecr_repository" "institution_api" {
  name                 = "digzio/institution-api"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  tags = { Project = "Digzio", Environment = "prod", Service = "institution-api" }
}

resource "aws_ecr_lifecycle_policy" "kyc_service" {
  repository = aws_ecr_repository.kyc_service.name
  policy = jsonencode({ rules = [{ rulePriority = 1, description = "Keep last 10 images", selection = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }, action = { type = "expire" } }] })
}

resource "aws_ecr_lifecycle_policy" "application_service" {
  repository = aws_ecr_repository.application_service.name
  policy = jsonencode({ rules = [{ rulePriority = 1, description = "Keep last 10 images", selection = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }, action = { type = "expire" } }] })
}

resource "aws_ecr_lifecycle_policy" "lease_service" {
  repository = aws_ecr_repository.lease_service.name
  policy = jsonencode({ rules = [{ rulePriority = 1, description = "Keep last 10 images", selection = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }, action = { type = "expire" } }] })
}

resource "aws_ecr_lifecycle_policy" "institution_api" {
  repository = aws_ecr_repository.institution_api.name
  policy = jsonencode({ rules = [{ rulePriority = 1, description = "Keep last 10 images", selection = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }, action = { type = "expire" } }] })
}
