module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.5.4"

  identifier = "digzio-db-${var.environment}"

  engine               = "postgres"
  engine_version       = "15"
  family               = "postgres15" # DB parameter group
  major_engine_version = "15"         # DB option group
  instance_class       = "db.t4g.micro"

  allocated_storage     = 20
  max_allocated_storage = 100

  db_name  = "digzio"
  username = "digzio_admin"
  password = var.db_password
  port     = 5432

  multi_az               = false # Cost savings for MVP
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]

  maintenance_window      = "Mon:00:00-Mon:03:00"
  backup_window           = "03:00-06:00"
  backup_retention_period = 7

  create_db_subnet_group = true
  subnet_ids             = module.vpc.private_subnets

  # Disable deletion protection for easy teardown in MVP/Dev (Enable in real prod)
  deletion_protection = false

  # PostGIS requires specific parameters
  parameters = [
    {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements"
    }
  ]
}

resource "aws_security_group" "rds" {
  name        = "digzio-rds-sg-${var.environment}"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
