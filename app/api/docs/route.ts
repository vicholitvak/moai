import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * Serve API documentation as JSON for tools like Swagger/OpenAPI
 */
export async function GET() {
  try {
    // Read the markdown documentation
    const docsPath = path.join(process.cwd(), 'docs', 'API_DOCUMENTATION.md')
    const docsContent = fs.readFileSync(docsPath, 'utf8')
    
    // Basic OpenAPI specification
    const openApiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Moai API',
        version: '1.0.0',
        description: 'Food delivery platform API for connecting home cooks with customers',
        contact: {
          name: 'Moai Support',
          email: 'api@moai.com',
          url: 'https://moai-wheat.vercel.app/support'
        },
        license: {
          name: 'Proprietary',
          url: 'https://moai-wheat.vercel.app/terms'
        }
      },
      servers: [
        {
          url: 'https://moai-wheat.vercel.app',
          description: 'Production server'
        },
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      paths: {
        '/api/health': {
          get: {
            summary: 'Health check endpoint',
            description: 'Returns the current health status of the API',
            responses: {
              '200': {
                description: 'Service is healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                        timestamp: { type: 'string', format: 'date-time' },
                        services: {
                          type: 'object',
                          properties: {
                            database: { type: 'string', example: 'ok' },
                            payment: { type: 'string', example: 'ok' },
                            notifications: { type: 'string', example: 'ok' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/orders/create': {
          post: {
            summary: 'Create new order',
            description: 'Creates a new order for food delivery',
            security: [{ BearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['customerId', 'cookerId', 'dishes', 'deliveryAddress', 'paymentMethod', 'total'],
                    properties: {
                      customerId: { type: 'string' },
                      cookerId: { type: 'string' },
                      dishes: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            dishId: { type: 'string' },
                            quantity: { type: 'integer', minimum: 1 },
                            price: { type: 'number', minimum: 0 },
                            customizations: { type: 'string' }
                          }
                        }
                      },
                      deliveryAddress: {
                        type: 'object',
                        properties: {
                          street: { type: 'string' },
                          city: { type: 'string' },
                          coordinates: {
                            type: 'object',
                            properties: {
                              lat: { type: 'number' },
                              lng: { type: 'number' }
                            }
                          }
                        }
                      },
                      paymentMethod: { type: 'string', enum: ['card', 'cash_on_delivery'] },
                      total: { type: 'number', minimum: 0 },
                      deliveryFee: { type: 'number', minimum: 0 },
                      specialInstructions: { type: 'string' }
                    }
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Order created successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        orderId: { type: 'string' },
                        estimatedDelivery: { type: 'string', format: 'date-time' },
                        deliveryCode: { type: 'string' }
                      }
                    }
                  }
                }
              },
              '400': { description: 'Invalid request data' },
              '401': { description: 'Unauthorized' },
              '403': { description: 'Forbidden' }
            }
          }
        },
        '/api/dishes': {
          get: {
            summary: 'Get all dishes',
            description: 'Retrieves a list of available dishes with optional filtering',
            parameters: [
              {
                name: 'category',
                in: 'query',
                description: 'Filter by dish category',
                schema: { type: 'string' }
              },
              {
                name: 'available',
                in: 'query',
                description: 'Filter by availability',
                schema: { type: 'boolean' }
              },
              {
                name: 'cookerId',
                in: 'query',
                description: 'Filter by cook ID',
                schema: { type: 'string' }
              },
              {
                name: 'limit',
                in: 'query',
                description: 'Number of results per page',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
              },
              {
                name: 'offset',
                in: 'query',
                description: 'Pagination offset',
                schema: { type: 'integer', minimum: 0, default: 0 }
              }
            ],
            responses: {
              '200': {
                description: 'List of dishes',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        dishes: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              description: { type: 'string' },
                              price: { type: 'number' },
                              category: { type: 'string' },
                              images: { type: 'array', items: { type: 'string' } },
                              isAvailable: { type: 'boolean' },
                              cookerId: { type: 'string' },
                              preparationTime: { type: 'integer' }
                            }
                          }
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer' },
                            limit: { type: 'integer' },
                            offset: { type: 'integer' },
                            hasMore: { type: 'boolean' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Firebase Authentication JWT token'
          }
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                  details: { type: 'string' }
                }
              },
              timestamp: { type: 'string', format: 'date-time' },
              requestId: { type: 'string' }
            }
          },
          OrderStatus: {
            type: 'string',
            enum: ['pending', 'accepted', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']
          },
          PaymentMethod: {
            type: 'string',
            enum: ['card', 'cash_on_delivery']
          },
          UserRole: {
            type: 'string',
            enum: ['client', 'cooker', 'driver', 'admin']
          }
        }
      },
      tags: [
        {
          name: 'Orders',
          description: 'Order management operations'
        },
        {
          name: 'Dishes',
          description: 'Dish catalog operations'
        },
        {
          name: 'Users',
          description: 'User management operations'
        },
        {
          name: 'Payments',
          description: 'Payment processing operations'
        },
        {
          name: 'Notifications',
          description: 'Push notifications and email operations'
        },
        {
          name: 'Health',
          description: 'System health and monitoring'
        }
      ]
    }

    return NextResponse.json({
      documentation: {
        markdown: docsContent,
        openapi: openApiSpec,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json'
      }
    })

  } catch (error: any) {
    console.error('Error serving API documentation:', error)
    
    return NextResponse.json({
      error: {
        code: 'DOCS_ERROR',
        message: 'Unable to load API documentation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }, { status: 500 })
  }
}

/**
 * Return API documentation info
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
      'Last-Modified': new Date().toUTCString()
    }
  })
}