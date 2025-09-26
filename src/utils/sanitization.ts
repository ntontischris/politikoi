import DOMPurify from 'dompurify'

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param input - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
}

/**
 * Sanitizes plain text input by removing HTML tags completely
 * @param input - The text input to sanitize
 * @returns Plain text with HTML tags removed
 */
export const sanitizeText = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
}

/**
 * Validates and sanitizes email input
 * @param email - Email string to validate and sanitize
 * @returns Sanitized email or empty string if invalid
 */
export const sanitizeEmail = (email: string): string => {
  const sanitized = sanitizeText(email.trim().toLowerCase())
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(sanitized) ? sanitized : ''
}

/**
 * Validates and sanitizes phone number input
 * @param phone - Phone string to validate and sanitize
 * @returns Sanitized phone or empty string if invalid
 */
export const sanitizePhone = (phone: string): string => {
  const sanitized = sanitizeText(phone.replace(/\s+/g, ''))
  const phoneRegex = /^(69|68|210|211|213|231|241|251|261|271|281|26944)\d{7,8}$/
  return phoneRegex.test(sanitized) ? sanitized : ''
}

/**
 * Validates and sanitizes Greek AFM (Tax ID)
 * @param afm - AFM string to validate and sanitize
 * @returns Sanitized AFM or empty string if invalid
 */
export const sanitizeAFM = (afm: string): string => {
  const sanitized = sanitizeText(afm.replace(/\s+/g, ''))
  const afmRegex = /^\d{9}$/
  return afmRegex.test(sanitized) ? sanitized : ''
}

/**
 * Sanitizes name input allowing only Greek and Latin characters
 * @param name - Name string to sanitize
 * @returns Sanitized name
 */
export const sanitizeName = (name: string): string => {
  const sanitized = sanitizeText(name.trim())
  // Allow Greek, Latin letters, spaces, hyphens, and apostrophes
  return sanitized.replace(/[^a-zA-ZΑ-Ωα-ωάέήίόύώΆΈΉΊΌΎΏ\s\-']/g, '')
}

/**
 * Sanitizes address input
 * @param address - Address string to sanitize
 * @returns Sanitized address
 */
export const sanitizeAddress = (address: string): string => {
  const sanitized = sanitizeText(address.trim())
  // Allow letters, numbers, spaces, common punctuation for addresses
  return sanitized.replace(/[^a-zA-ZΑ-Ωα-ωάέήίόύώΆΈΉΊΌΎΏ0-9\s\-',./]/g, '')
}

/**
 * Comprehensive form data sanitization
 * @param formData - Object containing form fields to sanitize
 * @returns Sanitized form data object
 */
export const sanitizeFormData = <T extends Record<string, any>>(formData: T): T => {
  const sanitized = { ...formData }

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      switch (key) {
        case 'email':
          sanitized[key] = sanitizeEmail(value)
          break
        case 'phone':
        case 'mobile':
        case 'telephone':
          sanitized[key] = sanitizePhone(value)
          break
        case 'afm':
        case 'taxId':
          sanitized[key] = sanitizeAFM(value)
          break
        case 'name':
        case 'surname':
        case 'firstName':
        case 'lastName':
        case 'fullName':
          sanitized[key] = sanitizeName(value)
          break
        case 'address':
        case 'street':
        case 'municipality':
          sanitized[key] = sanitizeAddress(value)
          break
        default:
          // For other text fields, use general text sanitization
          sanitized[key] = sanitizeText(value)
      }
    }
  }

  return sanitized
}