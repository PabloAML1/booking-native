import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";

const CheckBox = ({ label, selected, onChange }) => (
  <View className="flex-row items-center justify-between py-2">
    <Text className="text-gray-700">{label}</Text>
    <Switch value={selected} onValueChange={(value) => onChange(value, label)} />
  </View>
);

const RadioButton = ({ label, selected, onChange }) => (
  <TouchableOpacity
    onPress={() => onChange(label)}
    className="flex-row items-center py-2"
  >
    <View
      className={`w-5 h-5 rounded-full border-2 ${
        selected ? "border-blue-500" : "border-gray-300"
      } items-center justify-center mr-3`}
    >
      {selected && <View className="w-3 h-3 rounded-full bg-blue-500" />}
    </View>
    <Text className="text-gray-700">{label}</Text>
  </TouchableOpacity>
);

const FilterModal = ({
  visible,
  onClose,
  selectedFilters,
  setSelectedFilters,
  selectedSort,
  setSelectedSort,
  onClearFilters,
}) => {
  const roomTypes = ["Single Bed", "Double Bed", "Luxury Room", "Family Suite"];
  const priceRanges = ["0 to 500", "500 to 1000", "1000 to 2000", "2000 to 3000", "3000+"];
  const sortOptions = ["Price Low to High", "Price High to Low", "Newest First"];

  const handleFilterChange = (checked, value, type) => {
    setSelectedFilters((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[type].push(value);
      } else {
        updated[type] = updated[type].filter((item) => item !== value);
      }
      return updated;
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[80%]">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <Text className="text-lg font-bold">Filters & Sort</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClearFilters}>
                <Text className="text-blue-500 font-medium">Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-gray-600 font-medium">✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="px-6 py-4">
            {/* Room Types */}
            <Text className="text-base font-semibold text-gray-800 mb-2">
              Room Type
            </Text>
            {roomTypes.map((room) => (
              <CheckBox
                key={room}
                label={room}
                selected={selectedFilters.roomType.includes(room)}
                onChange={(checked) => handleFilterChange(checked, room, "roomType")}
              />
            ))}

            {/* Price Range */}
            <Text className="text-base font-semibold text-gray-800 mt-6 mb-2">
              Price Range
            </Text>
            {priceRanges.map((range) => (
              <CheckBox
                key={range}
                label={`$ ${range}`}
                selected={selectedFilters.priceRange.includes(range)}
                onChange={(checked) => handleFilterChange(checked, range, "priceRange")}
              />
            ))}

            {/* Sort By */}
            <Text className="text-base font-semibold text-gray-800 mt-6 mb-2">
              Sort By
            </Text>
            {sortOptions.map((option) => (
              <RadioButton
                key={option}
                label={option}
                selected={selectedSort === option}
                onChange={setSelectedSort}
              />
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            className="bg-black m-6 rounded-lg py-4 items-center"
          >
            <Text className="text-white font-semibold">Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default FilterModal;