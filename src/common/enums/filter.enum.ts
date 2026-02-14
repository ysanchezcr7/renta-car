export enum PriceFilter {
	free = 'free', // $0
	low = 'low', // $0-$25
	medium = 'medium', // $25-$50
	high = 'high', // $50-$100
	premium = 'premium', // $100+
}

export enum RatingFilter {
	fourAndHalf = 'fourAndHalf', // 4.5+
	four = 'four', // 4.0+
	threeAndHalf = 'threeAndHalf', // 3.5+
	three = 'three', // 3.0+
}

export enum DistanceFilter {
	within1mi = 'within1mi',
	within5mi = 'within5mi',
	within10mi = 'within10mi',
	within25mi = 'within25mi',
	any = 'any',
}
