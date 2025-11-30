import { ScrollView, View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 bg-white">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
      </ScrollView>
    </View>
  );
}