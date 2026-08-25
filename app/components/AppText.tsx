import { Text as RNText, type TextProps } from 'react-native';

export default function Text(props: TextProps) {
  const { style, ...rest } = props;
  return <RNText {...rest} style={[{ fontFamily: 'OpenSans_700Bold' }, style]} />;
}