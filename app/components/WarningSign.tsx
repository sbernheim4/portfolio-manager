export const WarningSign = (props: { aboveThreshold: boolean }) => {
	return !props.aboveThreshold ? null : <p className="investment-line-item__warning-symbol">⚠️</p>
};
