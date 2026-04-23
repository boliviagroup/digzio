module "ecs" {
  source  = "terraform-aws-modules/ecs/aws"
  version = "5.9.1"

  cluster_name = "digzio-cluster-${var.environment}"

  fargate_capacity_providers = {
    FARGATE = {
      default_capacity_provider_strategy = {
        weight = 50
      }
    }
    FARGATE_SPOT = {
      default_capacity_provider_strategy = {
        weight = 50
      }
    }
  }
}
