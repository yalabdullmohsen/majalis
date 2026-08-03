from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_websocket_ready():
    with client.websocket_connect("/ws/live") as websocket:
        data = websocket.receive_json()

        assert data["type"] == "ready"

        websocket.send_json(
            {
                "type": "start",
                "language": "ar",
            }
        )

        data = websocket.receive_json()

        assert data["type"] in ["partial", "ready"]
