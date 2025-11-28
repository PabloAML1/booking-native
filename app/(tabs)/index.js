import { ScrollView, View } from "react-native";
import Hero from "../../components/Hero";
import FeaturedDestination from "../../components/FeaturedDestination";

export default function Home() {
  return (
    <View className="flex-1 bg-white">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Hero />
        <FeaturedDestination />
      </ScrollView>
    </View>
  );
}