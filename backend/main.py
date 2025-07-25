from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
from fastapi.middleware.cors import CORSMiddleware

API_KEY = "4uvgqtemcwoqaosxvvkzrnawe3lm7jco"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Location(BaseModel):
    magic: str

class PingRequest(BaseModel):
    type: str = "ping"
    target: str
    locations: List[Location]
    limit: Optional[int] = None 

@app.post("/ping")
async def ping(request: PingRequest):
    payload = {
        "type": request.type,
        "target": request.target,
        "locations": [{"magic": loc.magic} for loc in request.locations],
    }

    if request.limit:
        payload["limit"] = request.limit

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.globalping.io/v1/measurements",
            json=payload,
            headers=headers
        )

    if response.status_code not in (200, 201, 202):
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()



@app.get("/ping/{measurement_id}/full-results")
async def get_full_ping_results(measurement_id: str):
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }

    url = f"https://api.globalping.io/v1/measurements/{measurement_id}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            full_results = []
            for result in data.get("results", []):
                probe = result.get("probe", {})
                stats = result.get("result", {}).get("stats", {})
                full_results.append({
                    "city": probe.get("city"),
                    "country": probe.get("country"),
                    "continent": probe.get("continent"),
                    "network": probe.get("network"),
                    "asn": probe.get("asn"),
                    "latitude": probe.get("latitude"),
                    "longitude": probe.get("longitude"),
                    "rtt": {
                        "min": stats.get("min"),
                        "avg": stats.get("avg"),
                        "max": stats.get("max"),
                        "loss": f'{stats.get("loss", 0)}%'
                    },
                    "rawOutput": result.get("result", {}).get("rawOutput")
                })

            return {
                "target": data.get("target"),
                "probeCount": data.get("probesCount"),
                "results": full_results
            }

        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

