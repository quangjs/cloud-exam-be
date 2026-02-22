export default ({ env }) => ({
  // Documentation plugin (Swagger/OpenAPI)
  documentation: {
    enabled: true,
    config: {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Quick Quiz API',
        description: 'API documentation for Quick Quiz Backend',
        contact: {
          name: 'Quick Quiz Team',
          email: 'support@quickquiz.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      'x-strapi-config': {
        mutateDocumentation: (generatedDocumentationDraft) => {
          // You can mutate the documentation here
          return generatedDocumentationDraft;
        },
      },
      servers: [
        { url: 'http://localhost:1337/api', description: 'Development server' },
      ],
      security: [{ bearerAuth: [] }],
    },
  },

  // Email plugin configuration
  email: {
    config: {
      provider: env('EMAIL_PROVIDER', 'nodemailer'),
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: env.int('SMTP_PORT', 587),
        secure: env.bool('SMTP_SECURE', false), // true for 465, false for 587 (STARTTLS)
        auth: env('SMTP_USERNAME')
          ? {
              user: env('SMTP_USERNAME'),
              pass: env('SMTP_PASSWORD'),
            }
          : undefined,
        // Only set to true for local dev servers like Mailhog
        ...(env.bool('SMTP_IGNORE_TLS', false) && { ignoreTLS: true }),
      },
      settings: {
        defaultFrom: env('SMTP_FROM', 'noreply@quickquiz.com'),
        defaultReplyTo: env('SMTP_REPLY_TO', 'support@quickquiz.com'),
      },
    },
  },

  // Users & Permissions plugin configuration
  'users-permissions': {
    config: {
      // JWT configuration
      jwt: {
        expiresIn: '7d',
      },
      // Registration settings
      register: {
        allowedFields: ['username', 'email', 'password'],
      },
    },
  },
});
