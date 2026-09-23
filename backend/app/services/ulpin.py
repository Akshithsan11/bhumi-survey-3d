"""Bhumi Survey 3D - ULPIN Service"""


def generate_ulpin(
    plot_code: str,
    building_code: str | None = None,
    floor_code: str | None = None,
    unit_code: str | None = None,
) -> str:
    parts = ["IND", "TG", "HYD", plot_code]
    if building_code:
        parts.append(building_code)
    if floor_code:
        parts.append(floor_code)
    if unit_code:
        parts.append(unit_code)
    return "-".join(parts)


def validate_ulpin_format(ulpin_code: str) -> dict:
    if not ulpin_code:
        return {"valid": False, "error": "Empty code"}
    parts = ulpin_code.split("-")
    if len(parts) < 4:
        return {"valid": False, "error": "Too few segments (need at least IND-STATE-CITY-PLOT)"}
    if parts[0] != "IND":
        return {"valid": False, "error": "Country code must be IND"}
    return {
        "valid": True,
        "code": ulpin_code,
        "segments": len(parts),
        "country": parts[0],
        "state": parts[1],
        "city": parts[2],
        "plot": parts[3],
        "building": parts[4] if len(parts) > 4 else None,
        "floor": parts[5] if len(parts) > 5 else None,
        "unit": parts[6] if len(parts) > 6 else None,
    }