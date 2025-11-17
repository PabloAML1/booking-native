import React from "react";
import { View, Text } from "react-native";

const Title = ({ title, subTitle }) => {
  return (
    <View className="items-center">
      <Text className="text-2xl font-bold text-gray-800 text-center">
        {title}
      </Text>
      <Text className="text-gray-600 text-center mt-2 max-w-md">
        {subTitle}
      </Text>
    </View>
  );
};

export default Title;