import { StyleSheet } from 'react-native';
import { Text, View } from '../../components/Themed';

export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello 👋</Text>
      <Text style={styles.subtitle}>Notifications will begin to appear on the next tab over momentarily.</Text>
      <Text>Tap a notification to mark it as seen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingBottom: 6
  },
  subtitle: {
    textAlign: 'center'
  },
  separator: {
    marginVertical: 30,
    height: 1
  }
});
