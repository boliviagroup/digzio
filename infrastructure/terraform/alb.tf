# ============================================================
# Application Load Balancer — Sprint 2
# ============================================================

# Security group for ALB (public-facing)
resource "aws_security_group" "alb" {
  name        = "digzio-alb-sg-prod"
  description = "Security group for Digzio ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Name        = "digzio-alb-sg-prod"
  }
}

# Security group for ECS tasks (receives traffic from ALB only)
resource "aws_security_group" "ecs_tasks" {
  name        = "digzio-ecs-tasks-sg-prod"
  description = "Security group for Digzio ECS tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 3000
    to_port         = 3010
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Name        = "digzio-ecs-tasks-sg-prod"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "digzio-alb-prod"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = false

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Name        = "digzio-alb-prod"
  }
}

# HTTP listener — redirects to HTTPS
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Digzio API"
      status_code  = "200"
    }
  }
}

# Target groups for each microservice
resource "aws_lb_target_group" "auth_service" {
  name        = "digzio-auth-tg-prod"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "auth-service"
  }
}

resource "aws_lb_target_group" "property_api" {
  name        = "digzio-property-tg-prod"
  port        = 3002
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "property-api"
  }
}

resource "aws_lb_target_group" "image_api" {
  name        = "digzio-image-tg-prod"
  port        = 3003
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "image-api"
  }
}

resource "aws_lb_target_group" "notification_service" {
  name        = "digzio-notif-tg-prod"
  port        = 3004
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Service     = "notification-service"
  }
}

# ALB listener rules — path-based routing
resource "aws_lb_listener_rule" "auth" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.auth_service.arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/auth/*"]
    }
  }
}

resource "aws_lb_listener_rule" "property" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 20

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.property_api.arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/properties/*", "/api/v1/properties"]
    }
  }
}

resource "aws_lb_listener_rule" "image" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 30

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.image_api.arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/images/*"]
    }
  }
}

resource "aws_lb_listener_rule" "notification" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 40

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.notification_service.arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/notifications/*"]
    }
  }
}
