const int buzzerPin = 12;       // ESP32 pin for main buzzer (controlled by serial)
const int alertLedPin = 13;     // Alert LED for drowsiness detection (controlled by serial)
const int statusLEDPin = 2;     // Status LED to show code is running
const int statusBuzzerPin = 14; // Second buzzer for periodic status buzz

unsigned long previousMillis = 0;
const long interval = 500;      // Blink and buzz interval (every 500ms)
bool statusLedState = LOW;

void setup() {
  // Initialize pins for buzzer, LED, and status buzzer
  pinMode(buzzerPin, OUTPUT);
  pinMode(alertLedPin, OUTPUT);
  pinMode(statusLEDPin, OUTPUT);
  pinMode(statusBuzzerPin, OUTPUT);
  
  // Turn off all outputs at startup
  digitalWrite(buzzerPin, LOW);
  digitalWrite(alertLedPin, LOW);
  digitalWrite(statusLEDPin, LOW);
  digitalWrite(statusBuzzerPin, LOW);
  
  // Start serial communication
  Serial.begin(9600);
  
  // Confirm initialization on serial monitor
  Serial.println("ESP32 drowsiness detector initialized!");
}
 
void loop() {
  // Handle serial commands for main buzzer and alert LED
  if (Serial.available() > 0) {
    char command = Serial.read();
    if (command == '1') {
      tone(buzzerPin, 2000);          // Emit a 2000 Hz tone on the main buzzer
      digitalWrite(alertLedPin, HIGH);
      Serial.println("Alert ON");
    } 
    else if (command == '0') {
      noTone(buzzerPin);              // Stop the tone on the main buzzer
      digitalWrite(alertLedPin, LOW);
      Serial.println("Alert OFF");
    }
  }
  
  // Blink the status LED and buzz the status buzzer every interval
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    
    // Toggle status LED
    statusLedState = !statusLedState;
    digitalWrite(statusLEDPin, statusLedState);
    
    // Trigger a short beep on the status buzzer
    digitalWrite(statusBuzzerPin, HIGH);
    delay(50);  // Buzz for 50ms
    digitalWrite(statusBuzzerPin, LOW);
  }
}