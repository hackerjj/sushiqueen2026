# ============================================
# Sushi Queen - Terraform Outputs
# ============================================

# ─── VPC ─────────────────────────────────────

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

# ─── ALB ─────────────────────────────────────

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID (for Route53 alias)"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

# ─── ECS ─────────────────────────────────────

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "backend_service_name" {
  description = "Backend ECS service name"
  value       = aws_ecs_service.backend.name
}

output "frontend_service_name" {
  description = "Frontend ECS service name"
  value       = aws_ecs_service.frontend.name
}

# ─── DocumentDB ──────────────────────────────

output "docdb_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = aws_docdb_cluster.main.endpoint
}

output "docdb_reader_endpoint" {
  description = "DocumentDB reader endpoint"
  value       = aws_docdb_cluster.main.reader_endpoint
}

output "docdb_port" {
  description = "DocumentDB port"
  value       = aws_docdb_cluster.main.port
}

# ─── ElastiCache (Redis) ────────────────────

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = 6379
}

# ─── S3 ──────────────────────────────────────

output "s3_assets_bucket" {
  description = "S3 bucket name for static assets"
  value       = aws_s3_bucket.assets.bucket
}

output "s3_assets_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.assets.arn
}

# ─── CloudFront ──────────────────────────────

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

# ─── Connection Strings (for .env) ──────────

output "mongo_connection_string" {
  description = "MongoDB connection string for .env"
  value       = "mongodb://${var.docdb_username}:<password>@${aws_docdb_cluster.main.endpoint}:27017/${var.project_name}?authSource=admin"
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis connection string for .env"
  value       = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"
}

# ─── URLs ────────────────────────────────────

output "app_url" {
  description = "Application URL (via CloudFront)"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "api_url" {
  description = "API URL (via ALB)"
  value       = "https://${aws_lb.main.dns_name}/api"
}
