"use client"

import * as React from "react"
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { ExternalLink } from "lucide-react"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "pk.eyJ1IjoiZWR3YXJkLWJlZSIsImEiOiJjbGY4dnphYWIxdTlhM3RvMXgydm1mOG0wIn0.vyha3m_ZxEkM9ZCic-woOQ"

interface MapItem {
    id: string
    lat: number
    lng: number
    title: string
    description?: string
    link?: string
}

interface MapboxMapProps {
    items: MapItem[]
    center?: { lat: number; lng: number }
    zoom?: number
    height?: string
}

export default function MapboxMap({
    items,
    center = { lat: 8.4606, lng: -13.2324 }, // Default to Freetown, Sierra Leone
    zoom = 12,
    height = "500px",
}: MapboxMapProps) {
    const [popupInfo, setPopupInfo] = React.useState<MapItem | null>(null)

    return (
        <div className="relative rounded-lg overflow-hidden border-2 border-border z-0" style={{ height }}>
            <Map
                initialViewState={{
                    latitude: center.lat,
                    longitude: center.lng,
                    zoom: zoom
                }}
                mapStyle="mapbox://styles/mapbox/light-v10"
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: "100%", height: "100%" }}
            >
                <NavigationControl position="top-right" />
                <FullscreenControl position="top-right" />

                {items.map((item) => (
                    <Marker
                        key={item.id}
                        longitude={item.lng}
                        latitude={item.lat}
                        anchor="bottom"
                        onClick={(e: any) => {
                            e.originalEvent.stopPropagation();
                            setPopupInfo(item);
                        }}
                    >
                        <div className="cursor-pointer">
                            <svg
                                width="30"
                                height="30"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-primary drop-shadow-lg"
                            >
                                <path
                                    d="M12 21.7C12 21.7 20 15.6 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 15.6 12 21.7 12 21.7Z"
                                    fill="currentColor"
                                    stroke="white"
                                    strokeWidth="2"
                                />
                                <circle cx="12" cy="10" r="3" fill="white" />
                            </svg>
                        </div>
                    </Marker>
                ))}

                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={Number(popupInfo.lng)}
                        latitude={Number(popupInfo.lat)}
                        onClose={() => setPopupInfo(null)}
                        closeButton={true}
                        closeOnClick={false}
                        className="z-50"
                    >
                        <div className="p-1 min-w-[150px]">
                            <h3 className="font-bold text-sm block mb-1 text-foreground">{popupInfo.title}</h3>
                            {popupInfo.description && (
                                <p className="text-xs text-muted-foreground m-0 mb-2">{popupInfo.description}</p>
                            )}
                            {popupInfo.link && (
                                <a
                                    href={popupInfo.link}
                                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                                >
                                    View Details <ExternalLink className="h-3 w-3" />
                                </a>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    )
}
