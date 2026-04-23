# ============================================================
# CloudFront Distribution — Property Images CDN
# ============================================================

resource "aws_cloudfront_origin_access_control" "images" {
  name                              = "digzio-images-oac-prod"
  description                       = "OAC for Digzio property images S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "images" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Digzio Property Images CDN"
  default_root_object = ""
  price_class         = "PriceClass_All"

  origin {
    domain_name              = module.s3_images.s3_bucket_bucket_regional_domain_name
    origin_id                = "digzio-property-images-prod"
    origin_access_control_id = aws_cloudfront_origin_access_control.images.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "digzio-property-images-prod"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized

    response_headers_policy_id = "5cc3b908-e619-4b99-88e5-2cf7f45965bd" # CORS-With-Preflight
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Project     = "Digzio"
    Environment = "prod"
    Name        = "digzio-images-cdn-prod"
  }
}

# Allow CloudFront to read from the images S3 bucket
resource "aws_s3_bucket_policy" "property_images_cdn" {
  bucket = module.s3_images.s3_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${module.s3_images.s3_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.images.arn
          }
        }
      }
    ]
  })
}
