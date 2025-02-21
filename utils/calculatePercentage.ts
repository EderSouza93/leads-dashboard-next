

export function calculatePercentageDifference(today: number, yesterday: number): string {
    if (yesterday === 0) {
        return today > 0 ? '+100' : '0';
    }

    const difference = today - yesterday;
    const percentage = (difference / yesterday) * 100;
    const roundedPercentage = Math.round(percentage);

    return `${roundedPercentage >= 0 ? '+' : ''}${roundedPercentage}`;
}