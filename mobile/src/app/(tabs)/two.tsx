import { Text, View, ScrollView } from 'react-native';

export default function TabTwoScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="flex-1 items-center justify-center px-6"
    >
      <View className="items-center">
        <Text className="text-2xl font-bold text-black dark:text-white text-center">
          Welcome to Vibecode Narrator
        </Text>
        <Text className="text-sm text-gray-500 mt-4 dark:text-gray-400 text-center">
          This app runs entirely on-device without requiring a backend server.
        </Text>
        <Text className="text-sm text-gray-500 mt-4 dark:text-gray-400 text-center">
          Features available:{'\n'}
          • Text input and narration{'\n'}
          • Web content extraction{'\n'}
          • Text file import{'\n'}
          • Local storage{'\n'}
          • Multiple voice settings
        </Text>
      </View>
    </ScrollView>
  );
}
