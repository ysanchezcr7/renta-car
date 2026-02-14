import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

type Language = 'en' | 'es';

@Injectable()
export class EmailI18nService {
	private translations: Record<Language, any> = { en: {}, es: {} };

	constructor() {
		this.loadTranslations();
	}

	private loadTranslations() {
		// Try multiple paths to support both development and production builds
		const possiblePaths = [
			path.join(process.cwd(), 'src/common/mailer/i18n'), // Development
			path.join(__dirname, 'i18n'), // Production (compiled)
			path.join(process.cwd(), 'dist/src/common/mailer/i18n'), // Production alternative
		];

		let translationsLoaded = false;

		for (const translationsPath of possiblePaths) {
			try {
				const enPath = path.join(translationsPath, 'translations.en.json');
				const esPath = path.join(translationsPath, 'translations.es.json');

				if (fs.existsSync(enPath) && fs.existsSync(esPath)) {
					this.translations.en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
					this.translations.es = JSON.parse(fs.readFileSync(esPath, 'utf-8'));
					translationsLoaded = true;
					break;
				}
			} catch (error) {
				// Continue to next path
				continue;
			}
		}

		if (!translationsLoaded) {
			console.error('Error loading email translations: Files not found in any expected location');
			// Fallback to empty translations if files don't exist
			this.translations.en = {};
			this.translations.es = {};
		}
	}

	/**
	 * Get translation for a specific key
	 * @param lang Language code ('en' or 'es'), defaults to 'en'
	 * @param key Translation key (e.g., 'otp.subject')
	 * @param params Optional parameters to replace in the translation
	 */
	t(lang: Language = 'en', key: string, params?: Record<string, any>): string {
		const translation = this.getNestedValue(this.translations[lang] || this.translations.en, key);

		if (!translation) {
			// Fallback to English if translation not found
			const fallback = this.getNestedValue(this.translations.en, key);
			if (!fallback) {
				console.warn(`Translation missing for key: ${key}`);
				return key;
			}
			return this.replaceParams(fallback, params);
		}

		return this.replaceParams(translation, params);
	}

	/**
	 * Get nested value from object using dot notation
	 */
	private getNestedValue(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => current?.[key], obj);
	}

	/**
	 * Replace parameters in translation string
	 */
	replaceParams(text: string, params?: Record<string, any>): string {
		if (!params || !text) return text;

		let result = text;
		Object.keys(params).forEach((key) => {
			const regex = new RegExp(`{{${key}}}`, 'g');
			result = result.replace(regex, params[key]);
		});

		return result;
	}

	/**
	 * Get all translations for a specific section
	 */
	getSection(lang: Language = 'en', section: string): any {
		return this.translations[lang]?.[section] || this.translations.en?.[section] || {};
	}
}
