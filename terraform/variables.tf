# ============================================
# Sushi Queen - Terraform Variables
# ============================================

# ─── General ─────────────────────────────────

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "sushi-queen"
}

# ─── Networking ──────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ─── DocumentDB (MongoDB) ───────────────────

variable "docdb_username" {
  description = "DocumentDB master username"
  type        = string
  default     = "sushiqueen"
  sensitive   = true
}

variable "docdb_password" {
  description = "DocumentDB master password"
  type        = string
  sensitive   = true
}

variable "docdb_instance_class" {
  description = "DocumentDB instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "docdb_instance_count" {
  description = "Number of DocumentDB instances"
  type        = number
  default     = 1
}

# ─── ElastiCache (Redis) ────────────────────

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 1
}

# ─── ECS Fargate ─────────────────────────────

variable "ecr_repository_url" {
  description = "ECR repository URL for Docker images"
  type        = string
  default     = ""
}

variable "backend_cpu" {
  description = "Backend task CPU units (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Backend task memory in MB"
  type        = number
  default     = 1024
}

variable "backend_desired_count" {
  description = "Number of backend task instances"
  type        = number
  default     = 2
}

variable "frontend_cpu" {
  description = "Frontend task CPU units (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Frontend task memory in MB"
  type        = number
  default     = 512
}

variable "frontend_desired_count" {
  description = "Number of frontend task instances"
  type        = number
  default     = 2
}

# ─── SSL/TLS ─────────────────────────────────

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS on ALB"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Primary domain name (e.g., sushiqueen.com)"
  type        = string
  default     = "sushiqueen.com"
}
