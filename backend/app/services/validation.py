"""Bhumi Survey 3D - Validation Service"""

VALIDATION_RULES = [
    {"id": "height_positive", "name": "Height is positive", "check": lambda b: bool(b.height_m and float(b.height_m) > 0)},
    {"id": "floors_defined", "name": "Floors defined", "check": lambda b: bool(b.total_floors and b.total_floors > 0)},
    {"id": "type_specified", "name": "Building type specified", "check": lambda b: bool(b.building_type)},
    {"id": "has_parcel", "name": "Linked to a parcel", "check": lambda b: bool(b.parcel_id)},
    {"id": "ai_confidence", "name": "AI confidence >= 80%", "check": lambda b: bool(b.ai_confidence and float(b.ai_confidence) >= 80.0)},
    {"id": "floor_height", "name": "Avg floor height 2.5-4.5m", "check": lambda b: not (b.total_floors and b.height_m and b.total_floors > 0 and not (2.5 <= float(b.height_m) / b.total_floors <= 4.5))},
]


def validate_building(building) -> dict:
    passed = 0
    failed = []
    details = []
    for rule in VALIDATION_RULES:
        ok = rule["check"](building)
        if ok:
            passed += 1
        else:
            failed.append(rule["id"])
        details.append({"rule": rule["id"], "name": rule["name"], "passed": ok})
    score = int((passed / len(VALIDATION_RULES)) * 100)
    return {
        "overall_score": score,
        "passed_rules": passed,
        "failed_rules": failed,
        "details": details,
    }