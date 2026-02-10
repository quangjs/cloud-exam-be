export default ({ env }) => ({
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
