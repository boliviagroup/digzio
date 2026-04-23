# ============================================================
# ECS Task Definitions & Services — Sprint 2 Microservices
# ============================================================

# IAM role for ECS task execution
resource "aws_iam_role" "ecs_task_execution" {
  name = "digzio-ecs-task-execution-role-prod"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = {
    Project     = "Digzio"
    Environment = "prod"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow ECS to pull from Secrets Manager
resource "aws_iam_role_policy" "ecs_secrets" {
  name = "digzio-ecs-secrets-policy-prod"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue", "ssm:GetParameters"]
      Resource = "*"
    }]
  })
}

# IAM role for ECS tasks (runtime permissions)
resource "aws_iam_role" "ecs_task" {
  name = "digzio-ecs-task-role-prod"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = {
    Project     = "Digzio"
    Environment = "prod"
  }
}

# Allow ECS tasks to send emails via SES
resource "aws_iam_role_policy" "ecs_task_ses" {
  name = "digzio-ecs-task-ses-policy-prod"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ses:SendEmail", "ses:SendRawEmail"]
      Resource = "*"
    }]
  })
}

# Allow ECS tasks to access S3 images bucket
resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "digzio-ecs-task-s3-policy-prod"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        "${module.s3_images.s3_bucket_arn}",
        "${module.s3_images.s3_bucket_arn}/*"
      ]
    }]
  })
}

# CloudWatch log group for all services
resource "aws_cloudwatch_log_group" "services" {
  name              = "/ecs/digzio-prod"
  retention_in_days = 30

  tags = {
    Project     = "Digzio"
    Environment = "prod"
  }
}

# ---- Auth Service ----
resource "aws_ecs_task_definition" "auth_service" {
  family                   = "digzio-auth-service-prod"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "auth-service"
    image     = "${aws_ecr_repository.auth_service.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 3001, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "3001" },
      { name = "DB_HOST", value = module.db.db_instance_address },
      { name = "DB_PORT", value = "5432" },
      { name = "DB_NAME", value = "digzio" },
      { name = "REDIS_HOST", value = aws_elasticache_cluster.redis.cache_nodes[0].address },
      { name = "REDIS_PORT", value = "6379" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/digzio-prod"
        "awslogs-region"        = "af-south-1"
        "awslogs-stream-prefix" = "auth-service"
      }
    }
  }])

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "auth-service"
  }
}

resource "aws_ecs_service" "auth_service" {
  name            = "digzio-auth-service-prod"
  cluster         = module.ecs.cluster_id
  task_definition = aws_ecs_task_definition.auth_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.auth_service.arn
    container_name   = "auth-service"
    container_port   = 3001
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "auth-service"
  }
}

# ---- Property API ----
resource "aws_ecs_task_definition" "property_api" {
  family                   = "digzio-property-api-prod"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "property-api"
    image     = "${aws_ecr_repository.property_api.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 3002, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "3002" },
      { name = "DB_HOST", value = module.db.db_instance_address },
      { name = "DB_PORT", value = "5432" },
      { name = "DB_NAME", value = "digzio" },
      { name = "REDIS_HOST", value = aws_elasticache_cluster.redis.cache_nodes[0].address },
      { name = "REDIS_PORT", value = "6379" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/digzio-prod"
        "awslogs-region"        = "af-south-1"
        "awslogs-stream-prefix" = "property-api"
      }
    }
  }])

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "property-api"
  }
}

resource "aws_ecs_service" "property_api" {
  name            = "digzio-property-api-prod"
  cluster         = module.ecs.cluster_id
  task_definition = aws_ecs_task_definition.property_api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.property_api.arn
    container_name   = "property-api"
    container_port   = 3002
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "property-api"
  }
}

# ---- Image API ----
resource "aws_ecs_task_definition" "image_api" {
  family                   = "digzio-image-api-prod"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "image-api"
    image     = "${aws_ecr_repository.image_api.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 3003, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "3003" },
      { name = "S3_BUCKET", value = module.s3_images.s3_bucket_id },
      { name = "AWS_REGION", value = "af-south-1" },
      { name = "CLOUDFRONT_DOMAIN", value = aws_cloudfront_distribution.images.domain_name }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/digzio-prod"
        "awslogs-region"        = "af-south-1"
        "awslogs-stream-prefix" = "image-api"
      }
    }
  }])

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "image-api"
  }
}

resource "aws_ecs_service" "image_api" {
  name            = "digzio-image-api-prod"
  cluster         = module.ecs.cluster_id
  task_definition = aws_ecs_task_definition.image_api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.image_api.arn
    container_name   = "image-api"
    container_port   = 3003
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "image-api"
  }
}

# ---- Notification Service ----
resource "aws_ecs_task_definition" "notification_service" {
  family                   = "digzio-notification-service-prod"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "notification-service"
    image     = "${aws_ecr_repository.notification_service.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 3004, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "3004" },
      { name = "REDIS_HOST", value = aws_elasticache_cluster.redis.cache_nodes[0].address },
      { name = "REDIS_PORT", value = "6379" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/digzio-prod"
        "awslogs-region"        = "af-south-1"
        "awslogs-stream-prefix" = "notification-service"
      }
    }
  }])

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "notification-service"
  }
}

resource "aws_ecs_service" "notification_service" {
  name            = "digzio-notification-service-prod"
  cluster         = module.ecs.cluster_id
  task_definition = aws_ecs_task_definition.notification_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.notification_service.arn
    container_name   = "notification-service"
    container_port   = 3004
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "notification-service"
  }
}
