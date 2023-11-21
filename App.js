import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  TextInput,
  Button,
  SafeAreaView,
  Dimensions,
} from "react-native";

import Icon from "react-native-vector-icons/MaterialIcons";
import Entypo from "react-native-vector-icons/Entypo";
import Awesome from "react-native-vector-icons/FontAwesome5";
import MaterialCom from "react-native-vector-icons/MaterialCommunityIcons";
import Fontisto from "react-native-vector-icons/Fontisto";
import Feather from "react-native-vector-icons/Feather";
import MapView, { Marker, Circle, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Camera } from "expo-camera";
import * as Notifications from "expo-notifications";
import { Switch } from "react-native-switch";

const initialRegion = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const screenWidth = Dimensions.get("window").width;

const App = () => {
  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatBot"
          component={ChatBotScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Scout"
          component={ScoutScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Path"
          component={PathScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatWithWorker"
          component={ChatWithWorkerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EmergencyScreen"
          component={EmergencyScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const HomeScreen = ({ navigation }) => {
  useEffect(() => {
    const getPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Notification permissions are required!");
      }
    };

    getPermissions();
    const subscribeToLocationChanges = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Location Permission Status:", status);
      if (status !== "granted") {
        console.error("Location permission not granted");
        return;
      }

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Gets updated every 10 meters
        },
        (location) => {
          console.log("New Location:", location);
          checkUserEnteringDangerZone(location.coords);
        }
      );
    };

    async function registerForPushNotificationsAsync() {
      let token;
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;

      return token;
    }

    subscribeToLocationChanges();
  }, []);

  const goToSettings = () => {
    navigation.navigate("Settings");
  };

  const [isSafetyMenuVisible, setIsSafetyMenuVisible] = useState(false);

  const toggleSafetyMenu = () => {
    setIsSafetyMenuVisible(!isSafetyMenuVisible);
  };

  const SafetyMenu = ({ closeMenu }) => {
    const menuItems = [
      {
        icon: "package-variant-closed",
        library: MaterialCom,
        text: "안심\n택배함",
        style: styles.brownCircle,
      },
      {
        icon: "police-badge",
        library: MaterialCom,
        text: "지구대",
        style: styles.navyCircle,
      },
      {
        icon: "ceiling-light",
        library: MaterialCom,
        text: "스마트\n보안등",
        style: styles.yellowCircle,
      },
      {
        icon: "cctv",
        library: MaterialCom,
        text: "CCTV",
        style: styles.greenCircle,
      },
      {
        icon: "shield-home",
        library: MaterialCom,
        text: "지킴이집",
        style: styles.pinkCircle,
      },
    ];

    return (
      <View style={styles.safetyMenuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuButtons, item.style]}
          >
            <item.library name={item.icon} size={30} color="#fff" />
            <Text style={styles.menuButtonText}>{item.text}</Text>
          </TouchableOpacity>
        ))}

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.menuButtons, styles.closeButton]}
          onPress={closeMenu}
        >
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // State to track which danger zones have sent notifications
  const [notifiedZones, setNotifiedZones] = useState([]);

  const checkUserEnteringDangerZone = (coords) => {
    const { latitude, longitude } = coords;
    for (const area of dangerAreas) {
      const distance = getDistance({ latitude, longitude }, area.coordinate);
      if (distance < 100) {
        sendLocalNotification(area.title, area.description);
        setNotifiedZones([...notifiedZones, area.id]);
        break;
      }
    }
  };

  const sendLocalNotification = async (title, body) => {
    console.log(`Sending notification: Title - ${title}, Body - ${body}`);

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "주의!!",
        body: "위험 지역으로 진입 중입니다. 주의하여 진행하십시오.",
      },
      trigger: null,
    });
  };

  // Function to calculate distance between two coordinates
  const getDistance = (coord1, coord2) => {
    const rad = (x) => (x * Math.PI) / 180;
    const R = 6378137; // Earth’s mean radius in meters
    const dLat = rad(coord2.latitude - coord1.latitude);
    const dLong = rad(coord2.longitude - coord1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(coord1.latitude)) *
        Math.cos(rad(coord2.latitude)) *
        Math.sin(dLong / 2) *
        Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  const handleEmergencyButtonPress = async () => {
    const { status: cameraStatus } =
      await Camera.requestCameraPermissionsAsync();
    const { status: audioStatus } =
      await Camera.requestMicrophonePermissionsAsync();

    if (cameraStatus === "granted" && audioStatus === "granted") {
      navigation.navigate("EmergencyScreen");
    } else {
      console.log("Camera and/or audio permission denied");
    }
  };

  const dangerAreas = [
    {
      id: 1,
      coordinate: { latitude: 37.555841, longitude: 126.936913 },
      title: "차량 사고",
      description:
        "신천역 근처에서 대규모 차량 사고가 발생했습니다. 해당 지역을 피하십시오.",
    },
    {
      id: 2,
      coordinate: { latitude: 37.556523, longitude: 126.93717 },
      title: "차량 사고",
      description:
        "신천역 근처에서 대규모 차량 사고가 발생했습니다. 해당 지역을 피하십시오.",
    },
    {
      id: 3,
      coordinate: { latitude: 37.558967, longitude: 126.934976 },
      title: "가스 누출 경보",
      description:
        "연세거리에서 가스 누출이 보고되었습니다. 안전을 위해 구역이 봉쇄되었습니다. 주변을 피하십시오.",
    },
  ];

  const [showDangerZones, setShowDangerZones] = useState(false);

  const toggleDangerZones = () => {
    setShowDangerZones(!showDangerZones);
  };

  const [selectedArea, setSelectedArea] = React.useState(null);

  const handleAreaPress = (area) => {
    setSelectedArea(area);
  };

  const [address, setAddress] = React.useState("");

  const fetchAddress = async (latitude, longitude) => {
    try {
      let results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        let { region, street } = results[0];
        setAddress(`${region}, ${street}`);
      } else {
        console.log("No address found for this location."); // Log when no address is found
      }
    } catch (error) {
      console.error("Error in fetchAddress:", error); // Log the error
    }
  };

  const [region, setRegion] = React.useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [marker, setMarker] = React.useState(null);

  const handleCenterOnUser = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.error("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const handleAddMarker = () => {
    setRegion({
      ...region,
      latitudeDelta: region.latitudeDelta / 2,
      longitudeDelta: region.longitudeDelta / 2,
    });
  };

  const handleRemoveMarker = () => {
    setRegion({
      ...region,
      latitudeDelta: region.latitudeDelta * 2,
      longitudeDelta: region.longitudeDelta * 2,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ImageBackground
          source={require("./assets/images/Gradient_JeSIzAu.png")}
          style={styles.headerImage}
          resizeMode="cover"
        >
          <TouchableOpacity style={styles.menuButton} onPress={goToSettings}>
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Text container */}
          <View style={styles.textContainer}>
            <Text style={styles.headerText}>서울 안심이</Text>
          </View>

          <TouchableOpacity style={styles.profileButton}>
            <Awesome name="door-open" size={15} color="#000" />
          </TouchableOpacity>
        </ImageBackground>
      </View>

      {/* Location Header */}

      <View style={styles.LocationHeader}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={styles.LocationHeaderText}>
            {address || "위치 가져오기 중..."}
          </Text>
        </View>
      </View>

      {/* MapView */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          initialRegion={initialRegion}
          showsUserLocation={true}
          zoomControlEnabled={false}
          showsCompass={false}
          toolbarEnabled={false}
          showsMyLocationButton={false}
          onRegionChangeComplete={(region) => {
            setRegion(region);
            fetchAddress(region.latitude, region.longitude);
          }}
        >
          {showDangerZones &&
            dangerAreas.map((area) => (
              <React.Fragment key={area.id}>
                <Circle
                  center={area.coordinate}
                  radius={100}
                  fillColor="rgba(255,165,0, 0.3)"
                  strokeColor="rgba(255,165,0, 1)"
                />
                <Marker
                  coordinate={area.coordinate}
                  onPress={() => handleAreaPress(area)}
                  opacity={0}
                  anchor={{ x: 0.5, y: 0.5 }}
                  icon={{
                    uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAIAAADzYEcFAAAACXBIWXMAAAsSAAALEgHS3X78AAAA",
                  }}
                />
              </React.Fragment>
            ))}
        </MapView>
        {selectedArea && (
          <View style={styles.articleContainer}>
            <Text style={styles.articleTitle}>{selectedArea.title}</Text>
            <Text style={styles.articleDescription}>
              {selectedArea.description}
            </Text>
            <Button title="Close" onPress={() => setSelectedArea(null)} />
          </View>
        )}
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.floatingMenu}>
        <TouchableOpacity
          onPress={handleCenterOnUser}
          style={styles.floatingButton}
        >
          <Icon name="gps-fixed" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAddMarker}
          style={styles.floatingButton}
        >
          <Entypo name="plus" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRemoveMarker}
          style={styles.floatingButton}
        >
          <Entypo name="minus" size={30} color="#fff" />
        </TouchableOpacity>

        {/* Toggle Danger Zones Button */}
        <View style={styles.dangerButtonContainer}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={toggleDangerZones}
          >
            <Feather
              name={showDangerZones ? "alert-triangle" : "triangle"}
              size={25}
              color="#fff"
            />
            <Text style={styles.dangerText}>위험 구역</Text>
          </TouchableOpacity>

          <View style={styles.ansimFacilityButtonContainer}>
            <TouchableOpacity
              onPress={toggleSafetyMenu}
              style={styles.ansimFacilityButton}
            >
              <Awesome name="search-location" size={25} color="#fff" />
              <Text style={styles.ansimFacilityButtonText}>안심시설</Text>
            </TouchableOpacity>

            {isSafetyMenuVisible && <SafetyMenu closeMenu={toggleSafetyMenu} />}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton}>
          <MaterialCom name="shield-home" size={24} color="#fff" />
          <Text style={styles.footerText}>모니터링</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.footerDivider} />

        <TouchableOpacity style={styles.footerButton}>
          <Icon name="taxi-alert" size={24} color="#fff" />
          <Text style={styles.footerText}>안심택시</Text>
        </TouchableOpacity>

        {/* Transparent Spacer */}
        <View style={styles.footerSpacer}></View>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate("Scout")}
        >
          <Fontisto name="persons" size={24} color="#fff" />
          <Text style={styles.footerText}>스카우트</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.footerDivider} />

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate("Path")}
        >
          <Awesome name="route" size={24} color="#fff" />
          <Text style={styles.footerText}>안심 경로</Text>
        </TouchableOpacity>
      </View>

      {/* Combined Emergency and Chatbot Button */}
      <View style={styles.combinedButtonOuter}>
        <TouchableOpacity style={styles.combinedButton}>
          {/* Emergency Button Half */}
          <View style={[styles.halfCircle, styles.leftHalf]}>
            <TouchableOpacity
              style={styles.halfButton}
              onPress={handleEmergencyButtonPress}
            >
              <Image
                source={require("./assets/images/siren.png")}
                style={styles.halfButtonImage}
              />
              <Text style={styles.halfButtonText}>긴급신고</Text>
            </TouchableOpacity>
          </View>

          {/* Separator Line */}
          <View style={styles.separator} />

          {/* Chatbot Button Half */}
          <View style={[styles.halfCircle, styles.rightHalf]}>
            <TouchableOpacity
              style={styles.halfButton}
              onPress={() => navigation.navigate("ChatBot")}
            >
              <Image
                source={require("./assets/images/chatbot.png")}
                style={styles.halfButtonImage}
              />
              <Text style={styles.halfButtonText}>채팅봇</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ChatBotScreen = ({ navigation }) => {
  const [userInput, setUserInput] = React.useState("");
  const [messages, setMessages] = React.useState([
    {
      text: "안녕하세요, 긴급한 상황에서 도움을 드리기 위해 왔습니다. 🆘 위험에 처했거나 응급 서비스가 필요하거나 즉각적인 도움이 필요한 경우 바로 알려주세요. 긴급하게 누군가에게 연락해야 하는 경우에도 저에게 알려주세요. 상황이나 요청 사항을 입력하시면 최선을 다해 도와드리겠습니다.",
      sender: "bot",
    },
  ]);
  const scrollViewRef = React.useRef();

  const handleUserInput = () => {
    const newMessage = { text: userInput, sender: "user" };

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newMessage];

      if (userInput.toLowerCase().includes("경찰")) {
        updatedMessages.push({
          text: "가장 가까운 경찰서로 연결해 드립니다. 정확한 위치와 상황을 알려줄 준비를 하세요.",
          sender: "bot",
        });
      } else if (userInput.toLowerCase().includes("구급차")) {
        updatedMessages.push({
          text: "현재 위치로 구급차가 출동 중입니다. 응급 상황에 대한 추가 세부 정보를 알려주세요.",
          sender: "bot",
        });
      }

      return updatedMessages;
    });

    setUserInput("");
  };

  React.useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <ImageBackground
          source={require("./assets/images/Gradient_JeSIzAu.png")}
          style={styles.headerImage}
          resizeMode="cover"
        >
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Text container */}
          <View style={styles.textContainer}>
            <Text style={styles.headerText}>채팅봇</Text>
          </View>

          <TouchableOpacity style={styles.profileButton}>
            <Awesome name="door-open" size={15} color="#000" />
          </TouchableOpacity>
        </ImageBackground>
      </View>

      <ScrollView
        style={styles.chatContainer}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current.scrollToEnd({ animated: true })
        }
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.sender === "user" ? styles.userMessage : styles.botMessage,
            ]}
          >
            <Text style={styles.messageText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputField}
          onChangeText={setUserInput}
          value={userInput}
          placeholder="Type a message..."
        />
        <Button title="Send" onPress={handleUserInput} />
      </View>
    </View>
  );
};

// PathScreen Component
const PathScreen = ({ navigation, route }) => {
  const [initialLocation, setInitialLocation] = useState("");
  const [finalDestination, setFinalDestination] = useState("");
  const [routePath, setRoutePath] = useState([]);

  const [showHelpPopup, setShowHelpPopup] = useState(false);

  const mockRoutePath = [
    { latitude: 37.561771, longitude: 126.936641 },
    { latitude: 37.561771, longitude: 126.937027 },
    { latitude: 37.560325, longitude: 126.936565 },
    { latitude: 37.559806, longitude: 126.936729 },
    { latitude: 37.557706, longitude: 126.936891 },
    { latitude: 37.557689, longitude: 126.93498 },
    { latitude: 37.556974, longitude: 126.934647 },
    { latitude: 37.556515, longitude: 126.935774 },
    { latitude: 37.556124, longitude: 126.935591 },
  ];

  const [showServiceWorkers, setShowServiceWorkers] = useState(false);

  const calculateRoute = () => {
    setRoutePath(mockRoutePath);
    setShowHelpPopup(true);
    setShowServiceWorkers(true);
  };

  const requestHelp = () => {
    navigation.navigate("ChatWithWorker");
  };

  const serviceWorkers = [
    {
      id: 1,
      coordinate: { latitude: 37.556651, longitude: 126.93396 },
      image: require("./assets/images/guide.png"),
    },
    {
      id: 2,
      coordinate: { latitude: 37.558199, longitude: 126.936355 },
      image: require("./assets/images/guide.png"),
    },
  ];

  const dangerAreas = [
    {
      id: 1,
      coordinate: { latitude: 37.555562, longitude: 126.936954 },
      title: "차량 사고",
      description:
        "신천역 근처에서 대규모 차량 사고가 발생했습니다. 해당 지역을 피하십시오.",
    },
    {
      id: 2,
      coordinate: { latitude: 37.556523, longitude: 126.93717 },
      title: "차량 사고",
      description:
        "신천역 근처에서 대규모 차량 사고가 발생했습니다. 해당 지역을 피하십시오.",
    },
    {
      id: 3,
      coordinate: { latitude: 37.558967, longitude: 126.934976 },
      title: "가스 누출 경보",
      description:
        "연세거리에서 가스 누출이 보고되었습니다. 안전을 위해 구역이 봉쇄되었습니다. 주변을 피하십시오.",
    },
  ];
  const [selectedArea, setSelectedArea] = React.useState(null);

  const handleAreaPress = (area) => {
    setSelectedArea(area);
  };

  return (
    <View style={styles.containerPath}>
      {/* Header */}
      <View style={styles.header}>
        <ImageBackground
          source={require("./assets/images/Gradient_JeSIzAu.png")}
          style={styles.headerImage}
          resizeMode="cover"
        >
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Text container */}
          <View style={styles.textContainer}>
            <Text style={styles.headerText}>안심 경로</Text>
          </View>

          <TouchableOpacity style={styles.profileButton}>
            <Awesome name="door-open" size={15} color="#000" />
          </TouchableOpacity>
        </ImageBackground>
      </View>

      <TextInput
        style={styles.input}
        onChangeText={setInitialLocation}
        value={initialLocation}
        placeholder="초기 위치"
      />
      <TextInput
        style={styles.input}
        onChangeText={setFinalDestination}
        value={finalDestination}
        placeholder="최종 목적지"
      />
      <Button title="경로 계산" onPress={calculateRoute} />
      {/* MapView */}
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        zoomControlEnabled={false}
        showsCompass={false}
        toolbarEnabled={false}
        showsMyLocationButton={false}
      >
        {dangerAreas.map((area) => (
          <React.Fragment key={area.id}>
            <Circle
              center={area.coordinate}
              radius={100}
              fillColor="rgba(255,165,0, 0.3)"
              strokeColor="rgba(255,165,0, 1)"
            />
            <Marker
              coordinate={area.coordinate}
              onPress={() => handleAreaPress(area)}
              opacity={0}
              anchor={{ x: 0.5, y: 0.5 }}
              icon={{
                uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAIAAADzYEcFAAAACXBIWXMAAAsSAAALEgHS3X78AAAA",
              }}
            />
          </React.Fragment>
        ))}

        {/* Display the mock route with a dashed line */}
        <Polyline
          coordinates={routePath}
          strokeColor="#4F85F3"
          strokeWidth={4}
          lineDashPattern={[10, 5]}
        />
      </MapView>
      {selectedArea && (
        <View style={styles.articleContainer}>
          <Text style={styles.articleTitle}>{selectedArea.title}</Text>
          <Text style={styles.articleDescription}>
            {selectedArea.description}
          </Text>
          <Button title="Close" onPress={() => setSelectedArea(null)} />
        </View>
      )}
    </View>
  );
};

// ScoutScreen Component
const ScoutScreen = ({ navigation, route }) => {
  const [initialLocation, setInitialLocation] = useState("");
  const [finalDestination, setFinalDestination] = useState("");
  const [routePath, setRoutePath] = useState([]);

  const [showHelpPopup, setShowHelpPopup] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState(null);

  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker);
    setRoutePath(workerRoutes[worker.id]);
  };

  const handleClosePopup = () => {
    setShowHelpPopup(false);
    setShowServiceWorkers(false);
    setSelectedWorker(null);
  };

  const handleChat = () => {
    setShowHelpPopup(false);
    setShowServiceWorkers(false);
    navigation.navigate("ChatWithWorker", { worker: selectedWorker });
  };

  const mockRoutePath = [
    { latitude: 37.559117, longitude: 126.940335 },
    { latitude: 37.559083, longitude: 126.939304 },
    { latitude: 37.559245, longitude: 126.939068 },
    { latitude: 37.559236, longitude: 126.937103 },
    { latitude: 37.560606, longitude: 126.936684 },
    { latitude: 37.561847, longitude: 126.93677 },
  ];

  const workerRoutes = {
    1: [
      { latitude: 37.556651, longitude: 126.93396 },
      { latitude: 37.556624, longitude: 126.934343 },
      { latitude: 37.55762, longitude: 126.934937 },
      { latitude: 37.557638, longitude: 126.936817 },
      { latitude: 37.559007, longitude: 126.936912 },
      { latitude: 37.560597, longitude: 126.936805 },
      { latitude: 37.560988, longitude: 126.936912 },
      { latitude: 37.560988, longitude: 126.936912 },
      { latitude: 37.561847, longitude: 126.93677 },
    ],
    2: [
      { latitude: 37.558199, longitude: 126.936355 },
      { latitude: 37.558486, longitude: 126.936328 },
      { latitude: 37.558503, longitude: 126.936876 },
      { latitude: 37.559035, longitude: 126.936924 },
      { latitude: 37.560055, longitude: 126.936887 },
      { latitude: 37.560999, longitude: 126.936978 },
      { latitude: 37.561084, longitude: 126.936591 },
      { latitude: 37.56182, longitude: 126.936715 },
    ],
    3: [
      { latitude: 37.559117, longitude: 126.940335 },
      { latitude: 37.559083, longitude: 126.939304 },
      { latitude: 37.559245, longitude: 126.939068 },
      { latitude: 37.559236, longitude: 126.937103 },
      { latitude: 37.560606, longitude: 126.936684 },
      { latitude: 37.561847, longitude: 126.93677 },
    ],
  };

  const [showServiceWorkers, setShowServiceWorkers] = useState(false);

  const findWorkers = () => {
    setShowHelpPopup(true);
    setShowServiceWorkers(true);
    setSelectedWorker(null);
  };

  const requestHelp = () => {
    navigation.navigate("ChatWithWorker");
  };

  const serviceWorkers = [
    {
      id: 1,
      coordinate: { latitude: 37.556651, longitude: 126.93396 },
      image: require("./assets/images/male1.jpg"),
    },
    {
      id: 2,
      coordinate: { latitude: 37.558199, longitude: 126.936355 },
      image: require("./assets/images/female1.jpg"),
    },
    {
      id: 3,
      coordinate: { latitude: 37.559117, longitude: 126.940335 },
      image: require("./assets/images/female2.jpg"),
    },
  ];

  const dangerAreas = [
    {
      id: 1,
      coordinate: { latitude: 37.555562, longitude: 126.936954 },
      title: "차량 사고",
      description:
        "신천역 근처에서 대규모 차량 사고가 발생했습니다. 해당 지역을 피하십시오.",
    },
    {
      id: 2,
      coordinate: { latitude: 37.556523, longitude: 126.93717 },
      title: "차량 사고",
      description:
        "신천역 근처에서 대규모 차량 사고가 발생했습니다. 해당 지역을 피하십시오.",
    },
    {
      id: 3,
      coordinate: { latitude: 37.558967, longitude: 126.934976 },
      title: "가스 누출 경보",
      description:
        "연세거리에서 가스 누출이 보고되었습니다. 안전을 위해 구역이 봉쇄되었습니다. 주변을 피하십시오.",
    },
  ];

  const [selectedArea, setSelectedArea] = React.useState(null);

  const handleAreaPress = (area) => {
    setSelectedArea(area);
  };

  const socialWorkers = [
    {
      id: 1,
      name: "모혁두",
      gender: "남",
      age: 27,
      phoneNumber: "123-456-7890",
      image: require("./assets/images/male1.jpg"), 
    },
    {
      id: 2,
      name: "김현지",
      gender: "여",
      age: 25,
      phoneNumber: "123-518-3284",
      image: require("./assets/images/female1.jpg"), 
    },
    {
      id: 3,
      name: "박치원",
      gender: "여",
      age: 38,
      phoneNumber: "123-091-0022",
      image: require("./assets/images/female2.jpg"), 
    },
  ];

  const SocialWorkerSelection = ({
    onSelect,
    selectedWorker,
    onChatPress,
    onClose,
  }) => {
    if (selectedWorker) {
      
      return (
        <View style={styles.selectedWorkerCard}>
          <Image source={selectedWorker.image} style={styles.profileImage} />
          <View style={styles.workerInfo}>
            <Text>{selectedWorker.name}</Text>
            <Text>
              {selectedWorker.gender}, {selectedWorker.age}
            </Text>
            <Text>{selectedWorker.phoneNumber}</Text>
          </View>
          <View style={styles.centeredTextContainer}>
            <Text style={styles.workerOnTheWayText}>
              {selectedWorker.name}님이 스카우트로 편성되었습니다. 채팅창으로
              위치를 알려주세요
            </Text>
          </View>

          <Button title="채팅" onPress={onChatPress} />
        </View>
      );
    } else {
      
      return (
        <View style={styles.socialWorkerList}>
          {socialWorkers.map((worker) => (
            <View key={worker.id} style={styles.socialWorkerCard}>
              <Image source={worker.image} style={styles.profileImage} />
              <View style={styles.workerInfo}>
                <Text>{worker.name}</Text>
                <Text>
                  {worker.gender}, {worker.age}
                </Text>
                <Text>{worker.phoneNumber}</Text>
              </View>
              <Button title="선택" onPress={() => onSelect(worker)} />
            </View>
          ))}
        </View>
      );
    }
    <Button title="닫기" onPress={onClose} />;
  };

  return (
    <View style={styles.containerPath}>
      {/* Header */}
      <View style={styles.header}>
        <ImageBackground
          source={require("./assets/images/Gradient_JeSIzAu.png")}
          style={styles.headerImage}
          resizeMode="cover"
        >
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Text container */}
          <View style={styles.textContainer}>
            <Text style={styles.headerText}>스카우트</Text>
          </View>

          <TouchableOpacity style={styles.profileButton}>
            <Awesome name="door-open" size={15} color="#000" />
          </TouchableOpacity>
        </ImageBackground>
      </View>

      <Button title="근처에 서비스 직원 찾기" onPress={findWorkers} />
      {/* MapView */}
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        zoomControlEnabled={false} 
        showsCompass={false} 
        toolbarEnabled={false} 
        showsMyLocationButton={false} 
      >
        {dangerAreas.map((area) => (
          <React.Fragment key={area.id}>
            <Circle
              center={area.coordinate}
              radius={100} 
              fillColor="rgba(255,165,0, 0.3)" 
              strokeColor="rgba(255,165,0, 1)" 
            />
            <Marker
              coordinate={area.coordinate}
              onPress={() => handleAreaPress(area)}
              opacity={0} 
              anchor={{ x: 0.5, y: 0.5 }} 
              icon={{
                uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAIAAADzYEcFAAAACXBIWXMAAAsSAAALEgHS3X78AAAA",
              }}
            />
          </React.Fragment>
        ))}

        {/* Render the route for the selected worker */}
        <Polyline
          coordinates={routePath}
          strokeColor="#4F85F3"
          strokeWidth={4}
          lineDashPattern={[10, 5]} 
        />

        {/* Conditional rendering of service worker markers */}
        {showServiceWorkers &&
          (selectedWorker ? (
            <Marker
              key={selectedWorker.id}
              coordinate={
                serviceWorkers.find((worker) => worker.id === selectedWorker.id)
                  .coordinate
              }
              title={selectedWorker.name}
              description={`${selectedWorker.gender}, ${selectedWorker.age}`}
            >
              <Image
                source={selectedWorker.image}
                style={styles.workerMarker}
                resizeMode="contain"
              />
            </Marker>
          ) : (
            serviceWorkers.map((worker) => (
              <Marker
                key={worker.id}
                coordinate={worker.coordinate}
                title={worker.name}
                description={`${worker.gender}, ${worker.age}`}
              >
                <Image
                  source={worker.image}
                  style={styles.workerMarker}
                  resizeMode="contain"
                />
              </Marker>
            ))
          ))}
      </MapView>
      {selectedArea && (
        <View style={styles.articleContainer}>
          <Text style={styles.articleTitle}>{selectedArea.title}</Text>
          <Text style={styles.articleDescription}>
            {selectedArea.description}
          </Text>
          <Button title="Close" onPress={() => setSelectedArea(null)} />
        </View>
      )}

      {/* Help Pop-up Window */}
      {showHelpPopup && (
        <SocialWorkerSelection
          onSelect={handleWorkerSelect}
          selectedWorker={selectedWorker}
          onChatPress={handleChat}
          onClose={handleClosePopup} 
        />
      )}
    </View>
  );
};

const ChatWithWorkerScreen = ({ navigation }) => {
  const [userInput, setUserInput] = React.useState("");
  const [messages, setMessages] = React.useState([
    {
      text: "이제 서비스 담당자와 연결되었습니다. 무엇을 도와드릴까요?",
      sender: "worker",
    },
  ]);
  const scrollViewRef = React.useRef();

  const handleUserInput = () => {
    const newMessage = { text: userInput, sender: "user" };
    setMessages([...messages, newMessage]);

    
    const workerResponse = {
      text: "메시지 주셔서 감사합니다. 5분 안에 도착하겠습니다.",
      sender: "worker",
    };
    setTimeout(() => {
      setMessages((prevMessages) => [...prevMessages, workerResponse]);
    }, 1000); 

    setUserInput(""); 
  };

  React.useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <ImageBackground
          source={require("./assets/images/Gradient_JeSIzAu.png")}
          style={styles.headerImage}
          resizeMode="cover"
        >
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Text container */}
          <View style={styles.textContainer}>
            <Text style={styles.headerText}>서비스 직원과 대화</Text>
          </View>

          <TouchableOpacity style={styles.profileButton}>
            <Awesome name="door-open" size={15} color="#000" />
          </TouchableOpacity>
        </ImageBackground>
      </View>

      <ScrollView
        style={styles.chatContainer}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current.scrollToEnd({ animated: true })
        }
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.sender === "user" ? styles.userMessage : styles.botMessage,
            ]}
          >
            <Text style={styles.messageText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputField}
          onChangeText={setUserInput}
          value={userInput}
          placeholder="Type a message..."
        />
        <Button title="Send" onPress={handleUserInput} />
      </View>
    </View>
  );
};

const EmergencyScreen = ({ navigation }) => {
  const cameraRef = useRef(null);

  const startRecording = async () => {
    if (cameraRef.current) {
      try {
        
        const video = await cameraRef.current.recordAsync();
        console.log("Video path: ", video.uri);
        
      } catch (error) {
        console.error("Error during recording: ", error);
      }
    } else {
      console.error("Camera not initialized");
    }
  };

  useEffect(() => {
    startRecording();
    
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stopRecording();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.preview}
        type={Camera.Constants.Type.back}
        flashMode={Camera.Constants.FlashMode.on}
        ratio={"16:9"} 
      >
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>
            녹화 중... 긴급 대응을 위해 사용자의 위치와 영상이 전송되고
            있습니다. 구조대가 출동 중이니 잠시만 기다려주세요.
          </Text>
        </View>
      </Camera>
    </View>
  );
};

const SettingsScreen = ({ navigation }) => {
  
  const [textMode, setTextMode] = useState(false);
  const [flashOn, setFlashOn] = useState(true);

  // Individual handlers for each switch
  const toggleTextMode = () => setTextMode((previousState) => !previousState);
  const toggleFlashOn = () => setFlashOn((previousState) => !previousState);

  const [isEnabled, setIsEnabled] = useState(false);

  const handleToggleSwitch = (newValue) => {
    setIsEnabled(newValue);
  };

  return (
    <View style={styles.settingsContainer}>
      <SafeAreaView style={styles.settingsContainer}>
        <View style={styles.headerSettings}>
          {/* Empty View to balance the header */}
          <View style={{ flex: 1 }}></View>
          {/* Centered title text */}
          <Text style={styles.headerSettingsText}>안심이 설정</Text>
          {/* Empty View to balance the header */}
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.settingsCloseButton}
            >
              <Icon name="close" size={24} color="#182570" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 1 */}
        <View style={styles.sectionContainer}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>테스트모드</Text>

          {/* Section Subtitle */}
          <Text style={styles.sectionSubtitle}>
            실제 신고가 접수되지 않은 테스트를 시험해볼 수 있습니다.
          </Text>

          {/* Option with Switch */}
          <View style={styles.settingsOption}>
            <Text style={styles.optionText}>긴급신고 테스트모드</Text>
            <View style={styles.switchContainer}>
              <Switch
                value={textMode}
                onValueChange={toggleTextMode}
                disabled={false}
                activeText="ON"
                inActiveText="OFF"
                circleSize={30}
                barHeight={27}
                circleBorderWidth={0}
                backgroundActive="navy"
                backgroundInactive="#E7E8EC"
                circleActiveColor="white"
                circleInActiveColor="white"
                changeValueImmediately={true}
                innerCircleStyle={
                  isEnabled
                    ? styles.innerCircleActive
                    : styles.innerCircleInactive
                }
                outerCircleStyle={styles.outerCircle}
                renderActiveText={true}
                renderInActiveText={true}
                switchLeftPx={3} 
                switchRightPx={3} 
                switchWidthMultiplier={1.5} 
                switchBorderRadius={20}
                activeTextStyle={styles.activeText}
                inactiveTextStyle={styles.inactiveText}
              />
            </View>
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.sectionContainer}>
          {/* Section Title */}
          <Text style={styles.sectionTitle}>귀가모니터링 설정</Text>

          {/* Option 1 */}
          <View style={styles.settingsOption}>
            <Text style={styles.optionText}>자동 종료 시간 설정</Text>
            <TouchableOpacity style={styles.optionValueContainer}>
              <Text style={styles.optionValue}>60분</Text>
              <Icon name="chevron-right" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Option 2 */}
          <View style={styles.settingsOption}>
            <Text style={styles.optionText}>자동 종료 방법 설정</Text>
            <TouchableOpacity style={styles.optionValueContainer}>
              <Text style={styles.optionValue}>자동 (목적지 도착)</Text>
              <Icon name="chevron-right" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3 */}
        <View style={styles.sectionContainer}>
          {/* Section Title with Alarm Icon */}
          <View style={styles.sectionTitleContainer}>
            <Image
              source={require("./assets/images/siren.png")}
              style={styles.alarmIcon}
            />
            <Text style={styles.sectionTitle}>긴급신고 설정</Text>
          </View>

          {/* Option 1 */}
          <View style={styles.settingsOption}>
            <Text style={styles.optionText}>흔들기 횟수</Text>
            <TouchableOpacity style={styles.optionValueContainer}>
              <Text style={styles.optionValue}>3회 이상</Text>
              <Icon name="chevron-right" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Option 2 */}
          <View style={styles.settingsOption}>
            <Text style={styles.optionText}>위급 상황 현장 사진 전송 설정</Text>
            <TouchableOpacity style={styles.optionValueContainer}>
              <Text style={styles.optionValue}>동영상</Text>
              <Icon name="chevron-right" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Option 3 */}
          <View style={styles.settingsOption}>
            <Text style={styles.optionText}>상황발생 효과음</Text>
            <TouchableOpacity style={styles.optionValueContainer}>
              <Text style={styles.optionValue}>진동</Text>
              <Icon name="chevron-right" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Option 4 with Switch */}
          <View style={styles.settingsOption}>
            <Text style={styles.optionText}>플래쉬 켜짐</Text>
            <View style={styles.switchContainer}>
              <Switch
                value={isEnabled}
                onValueChange={(value) => setIsEnabled(value)}
                disabled={false}
                activeText="ON"
                inActiveText="OFF"
                circleSize={30}
                barHeight={27}
                circleBorderWidth={0}
                backgroundActive="navy"
                backgroundInactive="#E7E8EC"
                circleActiveColor="white"
                circleInActiveColor="white"
                changeValueImmediately={true}
                innerCircleStyle={
                  isEnabled
                    ? styles.innerCircleActive
                    : styles.innerCircleInactive
                }
                outerCircleStyle={styles.outerCircle}
                renderActiveText={true}
                renderInActiveText={true}
                switchLeftPx={3} 
                switchRightPx={3} 
                switchWidthMultiplier={1.5} 
                switchBorderRadius={20}
                activeTextStyle={styles.activeText}
                inactiveTextStyle={styles.inactiveText}
              />
            </View>
          </View>
        </View>

        {/* Bottom Save Button Container */}
        <View style={{ width: "100%", position: "absolute", bottom: 0 }}>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Save Button Container */}
        <View style={{ width: "100%", position: "absolute", bottom: 0 }}>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const buttonSize = screenWidth * 0.16; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4A90E2", 
  },

  mapContainer: {
    flex: 1, 
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  header: {
    height: 100, 
    flexDirection: "row",
    justifyContent: "space-between", 
    alignItems: "center", 
  },
  headerImage: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end", 
    width: "100%",
    height: "100%", 
  },

  LocationHeader: {
    height: 50,
    flexDirection: "row",
    justifyContent: "space-between", 
    alignItems: "center", 
    backgroundColor: "rgba(212,225,229,1)",
  },

  LocationHeaderText: {
    color: "rgba(0,0,0,1)",
    fontWeight: "bold",
    fontSize: 16, 
    textAlign: "center", 
  },

  floatingMenu: {
    position: "absolute",
    right: 10,
    top: 200, 
  },

  floatingButton: {
    backgroundColor: "#4A90E2",
    width: 50, 
    height: 50, 
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderRadius: 5, 
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  menuButton: {
    padding: 10,
    marginLeft: 10, 
  },
  profileButton: {
    margin: 10,
    marginRight: 10, 
    borderRadius: 13, 
    backgroundColor: "#fff", 
    justifyContent: "center",
    alignItems: "center",
    width: 26, 
    height: 26, 
    elevation: 3, 
    shadowOpacity: 0.3, 
    shadowRadius: 3, 
    shadowOffset: { height: 1, width: 0 }, 
  },

  headerText: {
    color: "#fff",
    fontWeight: "regular",
    fontSize: 25, 
    textAlign: "center", 
  },

  textContainer: {
    flex: 1,
    justifyContent: "center", 
    alignItems: "center", 
    paddingBottom: 20, 
  },

  body: {
    flex: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  locationButton: {

  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#5E849F",
    paddingVertical: 10,
  },

  footerButton: {
    alignItems: "center",
    padding: 10,
  },
  footerText: {
    color: "#FFFFFF",
    marginTop: 5,
    fontSize: 12,
  },
  footerDivider: {
    width: 1,
    backgroundColor: "#FFFFFF",
    height: "70%",
    alignSelf: "center",
  },

  footerSpacer: {
    flex: 0.8, 
  },

  footerButton: {
    flex: 1, 
    alignItems: "center",
    justifyContent: "center",
  },

  emergencyButton: {
    position: "absolute",
    bottom: 0, 
    alignSelf: "center", 
    justifyContent: "center", 
    alignItems: "center", 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: "white", 
    borderWidth: 5, 
    borderColor: "#D60C0C", 
    marginBottom: 10, 
  },
  combinedButtonOuter: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#D60C0C", 
  },
  combinedButtonOuter: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#D60C0C", 
  },
  combinedButton: {
    flexDirection: "row",
    width: "90%", 
    height: "90%", 
    justifyContent: "center",
    alignItems: "center",
  },
  halfCircle: {
    width: "50%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  leftHalf: {
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
    backgroundColor: "#fff", 
  },
  rightHalf: {
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    backgroundColor: "#fff", 
  },
  separator: {
    height: "105%", 
    width: 0.5,
    backgroundColor: "#000", 
  },
  halfButton: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  halfButtonImage: {
    width: 30,
    height: 30,
  },
  halfButtonText: {
    fontSize: 10,
    color: "#000",
    marginTop: 5,
  },
  bottomButtonText: {
    fontSize: 12,
    color: "#000",
    marginTop: 5,
  },
  emergencyText: {
    color: "#000000", 
    marginTop: 5, 
    fontSize: 12, 
    textAlign: "center", 
  },

  dangerButtonContainer: {
    position: "absolute",
    bottom: -150, 
    left: 0,
    alignSelf: "center", 
  },
  dangerButton: {
    backgroundColor: "#fc7b03",
    width: 50, 
    height: 50, 
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10, 
    borderRadius: 5, 
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  dangerText: {
    color: "#FFFFFF",
    fontSize: 12,
  },

facilitiesButtonContainer: {
  position: "absolute",
  bottom: '450%',
  right: '600%',
  alignItems: "center",
  justifyContent: "center",
},


safetyMenuContainer: {
  position: "absolute",
  top: '30%', 
  right: '6%', 
  width: '90%', 
  padding: 10,
  borderRadius: 5,
},

safetyMenu: {
    padding: 10,
    borderRadius: 5,
  },



    safetyMenuContainer: {
      position: 'absolute',
      top: 60 , 
      left: -8,
      right: 0,
    },

  ansimFacilityButtonContainer: {
      position: 'relative',
      bottom: 270,
      right: 300,
    },


ansimFacilityButton: {
    backgroundColor: "#55C8B6",
    width: 50, 
    height: 50, 
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10, 
    borderRadius: 5, 
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ansimFacilityButtonText: {
    fontSize: 10,
    color: '#FFFFFF',
  },





  facilitiesButton: {
    backgroundColor: "#55C8B6",
    width: 50, 
    height: 50, 
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10, 
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  facilitiesText: {
    color: "#FFFFFF",
    fontSize: 12,
  },

  chatContainer: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: "80%",
  },
  userMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  botMessage: {
    backgroundColor: "#ECECEC",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "white", 
  },
  inputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
    fontSize: 16,
  },

  articleContainer: {
    position: "absolute",
    bottom: 50, 
    left: 10,
    right: 10,
    backgroundColor: "rgb(255, 153, 51)",
    opacity: 0.9,
    padding: 20,
    borderRadius: 10,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  articleDescription: {
    fontSize: 16,
    marginTop: 10,
  },
  containerPath: {
    flex: 1,
    backgroundColor: "#FFFFFF", 
  },
  input: {
    marginLeft: 10,
    marginBottom: 20,
    width: "90%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 20,
    padding: 10,
  },
  map: {
    width: "100%",
    flex: 1,
  },

  helpPopup: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  helpPopupText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
  },

  workerMarker: {
    width: 40, 
    height: 40, 
  },

  preview: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    width: "100%",
    padding: 15,
  },
  overlayText: {
    textAlign: "center",
    color: "black",
  },

  menuButtons: {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2, 
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  closeButton: {
    backgroundColor: "#524e4e", 
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    justifyContent: "center",
    alignItems: "center",
  },

  brownCircle: {
    backgroundColor: "#805500",
  },
  navyCircle: {
    backgroundColor: "#0033cc",
  },
  yellowCircle: {
    backgroundColor: "#e6b800",
  },
  greenCircle: {
    backgroundColor: "#84d468",
  },
  pinkCircle: {
    backgroundColor: "#ff80bf",
  },
  menuButtonText: {
    color: "#fff",
    marginTop: 5,
    fontSize: 10,
  },

  settingsContainer: {
    flex: 1,
    backgroundColor: "#e7e8ec", 
  },
  headerSettings: {
    height: 100, 
    flexDirection: "row",
    justifyContent: "space-between", 
    alignItems: "center",
    backgroundColor: "#e7e8ec", 
  },
  headerSettingsText: {
    flex: 2, 
    textAlign: "center", 
    fontSize: 25,
    fontWeight: "bold",
    fontWeight: "700", 
    color: "#161a4a", 
    marginTop: 40, 
  },
  settingsCloseButton: {
    alignItems: "flex-end", 
    flex: 1,
    padding: 10,
    marginTop: 50, 
    marginRight: 10,
    color: "#161a4a",
  },
  settingsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc", 
  },
  settingsItemText: {
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: "#161a4a", 
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    width: "100%", 
  },
  saveButtonText: {
    color: "#FFFFFF", 
    fontSize: 20,
    fontWeight: "bold",
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    marginBottom: 15,
    paddingLeft: 30, 
    paddingTop: 20,
    paddingBottom: 5,
    marginLeft: 8,
    marginRight: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "gray",
    paddingVertical: 6,
  },
  settingsOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600", 
    color: "#000", 
  },
  optionValue: {
    fontSize: 16,
    color: "gray", 
  },
  optionValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold", 
    color: "#000", 
  },

  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  alarmIcon: {
    width: 24, 
    height: 24, 
    marginRight: 5,
  },

  outerCircle: {
    alignItems: "center",
    justifyContent: "center",
    elevation: 5, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  innerCircleActive: {
    alignItems: "flex-end", 
    paddingRight: 5,
  },
  innerCircleInactive: {
    alignItems: "flex-start", 
    paddingLeft: 5,
  },
  activeText: {
    color: "white", 
    fontWeight: "regular",
  },
  inactiveText: {
    color: "black",
    fontWeight: "regular",
  },
  switchContainer: {
    flex: 0, 
    paddingHorizontal: 20, 
    justifyContent: "flex-start", 
  },

  socialWorkerList: {
    padding: 10,
  },
  socialWorkerCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  workerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  centeredTextContainer: {
    flex: 0, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 10,
  },

  workerOnTheWayText: {
    fontSize: 15,
    color: 'black',
    textAlign: 'center',
    fontWeight: "bold",
  },

});
export default App;
