import serial
import time
from logging_config import log_event

class ESP32Comm:
    def __init__(self, port, baudrate=115200, timeout=1):
        """Initialize ESP32 communication."""
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.esp32 = None
        self.connected = False

    def connect(self):
        """Attempts to connect to the ESP32."""
        try:
            self.esp32 = serial.Serial(port=self.port, baudrate=self.baudrate, timeout=self.timeout)
            self.connected = True
            print(f"Connected to ESP32 on {self.port}")
            log_event(f"Connected to ESP32 on {self.port}")
            time.sleep(2)  # Allow time for ESP32 to initialize
            return True
        except serial.SerialException as e:
            print(f"Failed to connect to ESP32 on {self.port}: {e}")
            log_event(f"Failed to connect to ESP32 on {self.port}: {e}", level="error")
            return False

    def send(self, command):
        """Sends a command ('0' or '1') to the ESP32."""
        if not self.connected or not self.esp32:
            print("ESP32 not connected. Cannot send command.")
            log_event("Attempted to send command to ESP32, but it is not connected.", level="warning")
            return False
        try:
            self.esp32.write(command.encode())
            print(f"Sent '{command}' to ESP32.")
            log_event(f"Sent '{command}' to ESP32")
            return True
        except serial.SerialException as e:
            print(f"ESP32 write error: {e}")
            log_event(f"ESP32 write error: {e}", level="error")
            return False

    def disconnect(self):
        """Closes the serial connection."""
        if self.esp32 and self.esp32.is_open:
            self.esp32.close()
            print("ESP32 connection closed.")
            log_event("ESP32 connection closed")
        self.connected = False

    def is_connected(self):
        """Returns the connection status."""
        return self.connected