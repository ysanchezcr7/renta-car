// Enums para citas/notificaciones (ampliar según proyecto)
export enum AppointmentStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	CANCELLED = 'CANCELLED',
	COMPLETED = 'COMPLETED',
	REJECTED = 'REJECTED',
}

export enum NotificationType {
	List_BOOKING = 'listBooking',
	SURVEYS = 'surveys',
	INFO = 'info',
}
export enum NotificationApp {
	APP_ADMIN = 'appAdmin',
	APP_CLIENT = 'appClient',
}
