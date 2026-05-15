# SubHub — Football Substitution Intelligence Engine
# Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
# Unauthorised copying, distribution, or use is strictly prohibited.
# See LICENSE file for full terms.
"""
Playstyle Profiles — 6 tactical identities with formation compatibility matrix.
"""

PLAYSTYLES: dict = {

    "high_press": {
        "label": "High Press",
        "icon": "⚡",
        "description": "Win the ball high, transition immediately",
        "weights": {
            "press_reliability": 0.35,
            "stamina_decay":     0.25,
            "attribute_upgrade": 0.20,
            "impact_score":      0.15,
            "game_state":        0.05
        },
        "player_fit_formula": {
            "pace":                  0.30,
            "power_stamina":         0.30,
            "mentality_aggression":  0.25,
            "work_rate_att":         0.15
        },
        "sub_language": {
            "urgency_phrase": "missing press triggers",
            "sub_on_phrase":  "restores pressing intensity",
        },
        "formation_scores": {
            "4-3-3":            {"score": 95, "verdict": "PERFECT",  "reason": "3 forwards press simultaneously. Midfield trio supports immediately in transition."},
            "4-4-2":            {"score": 65, "verdict": "DECENT",   "reason": "Two banks of four are hard to coordinate into a high press. Midfield gets bypassed too easily."},
            "4-2-3-1":         {"score": 75, "verdict": "GOOD",     "reason": "CAM presses from front but double pivot anchors too deep to sustain high press intensity."},
            "3-5-2":            {"score": 55, "verdict": "DECENT",   "reason": "Only 2 press leaders up top. Wingbacks caught high leaves CBs exposed in wide channels."},
            "5-3-2":            {"score": 25, "verdict": "TERRIBLE", "reason": "Back 5 kills transition numbers. 3 midfielders cannot sustain high press alone. Gegenpressing requires numerical superiority forward."},
            "4-5-1":            {"score": 42, "verdict": "POOR",     "reason": "Lone striker cannot initiate press. Too isolated to trigger coordinated press across the line."},
            "4-4-2 Flat":       {"score": 68, "verdict": "DECENT",   "reason": "Two strikers press together but two banks of four are difficult to coordinate into a sustained high press."},
            "4-3-3 Attack":     {"score": 95, "verdict": "PERFECT",  "reason": "Peak pressing shape. Three forwards suffocate the opposition back line simultaneously."},
            "4-2-3-1 Wide":     {"score": 72, "verdict": "GOOD",     "reason": "Width helps press wide channels but double pivot limits press intensity in central zones."},
            "4-2-3-1 Narrow":   {"score": 70, "verdict": "GOOD",     "reason": "Compact shape focuses press centrally but lack of width allows easy wide escapes."},
            "4-1-2-1-2 Wide":   {"score": 78, "verdict": "GOOD",     "reason": "Two strikers press high with wide mids providing press triggers in wide channels."},
            "4-1-2-1-2 Narrow": {"score": 72, "verdict": "GOOD",     "reason": "Two strikers press centrally but narrow shape allows opposition to escape wide easily."},
            "4-4-1-1":          {"score": 60, "verdict": "DECENT",   "reason": "CF presses, ST holds shape. Press triggers are confused and difficult to coordinate."},
            "4-2-2-2":          {"score": 75, "verdict": "GOOD",     "reason": "Two strikers press high, box midfield covers ground quickly in second phase."},
            "4-3-1-2":          {"score": 70, "verdict": "GOOD",     "reason": "Two strikers press but narrow shape limits wide press coverage significantly."},
            "4-3-2-1":          {"score": 65, "verdict": "DECENT",   "reason": "Two CFs press but lack width to cover wide channels. Press shape becomes disjointed."},
            "4-5-1 Attack":     {"score": 45, "verdict": "POOR",     "reason": "Five midfielders too passive to press high. Lone striker isolated as press trigger."},
            "3-4-1-2":          {"score": 82, "verdict": "GREAT",    "reason": "Three CBs allow wingbacks to press aggressively. Two strikers hunt in pairs effectively."},
            "3-4-2-1":          {"score": 78, "verdict": "GOOD",     "reason": "Two CFs press high while wingbacks press wide channels. Three CBs provide security."},
            "3-1-4-2":          {"score": 72, "verdict": "GOOD",     "reason": "CDM anchoring deep limits press intensity but four midfielders cover ground quickly."},
            "3-4-3":            {"score": 90, "verdict": "PERFECT",  "reason": "Three forwards press aggressively. Three CBs provide defensive security behind the press."},
            "5-2-1-2":          {"score": 35, "verdict": "RISKY",    "reason": "Five defenders cannot press high. Suicidal use of resources leaves midfield completely exposed."},
            "5-2-2-1":          {"score": 30, "verdict": "RISKY",    "reason": "Too deep and narrow to press effectively. Five defenders stranded behind the press line."},
            "5-4-1 Flat":       {"score": 28, "verdict": "TERRIBLE", "reason": "Five defenders and flat four midfielders. No personnel available to lead a genuine press."},
            "5-4-1 Diamond":    {"score": 32, "verdict": "RISKY",    "reason": "CAM adds a press trigger but five defenders leave the shape too deep to press with conviction."},
        }
    },

    "positional_play": {
        "label": "Positional Play",
        "icon": "🔷",
        "description": "Control space, dominate possession",
        "weights": {
            "positional_integrity": 0.35,
            "passing_quality":      0.25,
            "attribute_upgrade":    0.20,
            "impact_score":         0.15,
            "stamina_decay":        0.05
        },
        "player_fit_formula": {
            "mentality_vision":        0.30,
            "attacking_short_passing": 0.30,
            "mentality_composure":     0.25,
            "mentality_positioning":   0.15
        },
        "sub_language": {
            "urgency_phrase": "losing positional structure",
            "sub_on_phrase":  "restores passing rhythm",
        },
        "formation_scores": {
            "4-3-3":            {"score": 88, "verdict": "GREAT",   "reason": "Three midfielders control central zones. Wide forwards stretch opposition defensive block."},
            "4-4-2":            {"score": 62, "verdict": "DECENT",  "reason": "Flat midfield lacks the central overload positional play requires. Too direct by design."},
            "4-2-3-1":         {"score": 97, "verdict": "PERFECT", "reason": "Double pivot recycles possession. CAM operates between lines. The definitive positional play shape."},
            "3-5-2":            {"score": 80, "verdict": "GREAT",   "reason": "Five midfielders dominate central zones. Wingbacks provide width to stretch the block."},
            "5-3-2":            {"score": 52, "verdict": "DECENT",  "reason": "Too defensive to circulate possession with purpose. Three midfielders overrun in build-up phase."},
            "4-5-1":            {"score": 75, "verdict": "GOOD",    "reason": "Five midfielders provide width and central presence but lone striker limits final third options."},
            "4-4-2 Flat":       {"score": 60, "verdict": "DECENT",  "reason": "Flat midfield lacks the central overload and layered structure positional play demands."},
            "4-3-3 Attack":     {"score": 90, "verdict": "PERFECT", "reason": "Three midfielders control central zones with three forwards stretching the defensive block wide."},
            "4-2-3-1 Wide":     {"score": 95, "verdict": "PERFECT", "reason": "Maximum width and central control. The definitive modern positional play shape with full pitch coverage."},
            "4-2-3-1 Narrow":   {"score": 98, "verdict": "PERFECT", "reason": "Narrow overload dominates central zones completely. Peak positional play when personnel have high vision and short passing."},
            "4-1-2-1-2 Wide":   {"score": 80, "verdict": "GREAT",   "reason": "Good central control with width. CDM provides security for the build-up phase."},
            "4-1-2-1-2 Narrow": {"score": 85, "verdict": "GREAT",   "reason": "Central overload with CDM anchor. Excellent for positional play through narrow central channels."},
            "4-4-1-1":          {"score": 68, "verdict": "DECENT",  "reason": "Decent coverage but CF and ST roles create positional confusion in the final third build-up."},
            "4-2-2-2":          {"score": 72, "verdict": "GOOD",    "reason": "Box midfield gives good coverage but lack of width limits positional play to central corridors."},
            "4-3-1-2":          {"score": 88, "verdict": "GREAT",   "reason": "Three CMs plus CAM creates four layers of central control. Excellent for recycling possession."},
            "4-3-2-1":          {"score": 92, "verdict": "PERFECT", "reason": "Three midfield layers plus two CFs. The Christmas Tree is built for positional dominance."},
            "4-5-1 Attack":     {"score": 78, "verdict": "GOOD",    "reason": "Five midfielders provide excellent width and central presence across the pitch."},
            "3-4-1-2":          {"score": 75, "verdict": "GOOD",    "reason": "Good central control but wingback dependency creates vulnerability in build-up under pressure."},
            "3-4-2-1":          {"score": 80, "verdict": "GREAT",   "reason": "Two CFs create overloads in the final third while four midfielders recycle possession effectively."},
            "3-1-4-2":          {"score": 82, "verdict": "GREAT",   "reason": "Four midfielders provide excellent coverage. CDM acts as pivot for clean positional build-up."},
            "3-4-3":            {"score": 82, "verdict": "GREAT",   "reason": "Excellent width and central presence. Three forwards stretch opposition to create positional gaps."},
            "5-2-1-2":          {"score": 65, "verdict": "DECENT",  "reason": "Two CMs limited in build-up. CAM isolated without midfield support to recycle possession."},
            "5-2-2-1":          {"score": 60, "verdict": "DECENT",  "reason": "Too deep and narrow for positional play. Shape retreats rather than circulates."},
            "5-4-1 Flat":       {"score": 58, "verdict": "DECENT",  "reason": "Too defensive to play positional football with purpose. Shape retreats into its own half."},
            "5-4-1 Diamond":    {"score": 65, "verdict": "DECENT",  "reason": "Diamond gives better central control than flat but five defenders limit positional ambition."},
        }
    },

    "low_block": {
        "label": "Low Block",
        "icon": "🛡",
        "description": "Defend deep, hit on the break",
        "weights": {
            "defensive_solidity": 0.40,
            "stamina_decay":      0.20,
            "attribute_upgrade":  0.20,
            "impact_score":       0.15,
            "game_state":         0.05
        },
        "player_fit_formula": {
            "defending":            0.35,
            "power_strength":       0.25,
            "power_stamina":        0.25,
            "mentality_aggression": 0.15
        },
        "sub_language": {
            "urgency_phrase": "defensive shape breaking down",
            "sub_on_phrase":  "reinforces defensive block",
        },
        "formation_scores": {
            "4-3-3":            {"score": 48, "verdict": "POOR",    "reason": "Three forwards do not track back consistently. Low block requires all ten outfield players behind the ball."},
            "4-4-2":            {"score": 78, "verdict": "GOOD",    "reason": "Two compact banks of four sit deep effectively. Dual strikers ready to break on the counter."},
            "4-2-3-1":         {"score": 65, "verdict": "DECENT",  "reason": "CAM creates a defensive hole in the block. Double pivot compensates but shape is not naturally compact."},
            "3-5-2":            {"score": 72, "verdict": "GOOD",    "reason": "Three CBs provide security but wingbacks pushed wide create gaps in the defensive block."},
            "5-3-2":            {"score": 96, "verdict": "PERFECT", "reason": "Five defenders plus three midfielders create a near-impenetrable low block. The definitive defensive shape."},
            "4-5-1":            {"score": 88, "verdict": "GREAT",   "reason": "Five midfielders create an impenetrable mid-block. Compact and disciplined by design."},
            "4-4-2 Flat":       {"score": 80, "verdict": "GREAT",   "reason": "Two compact banks of four sit deep with discipline. Classic low block shape with dual counter threat."},
            "4-3-3 Attack":     {"score": 45, "verdict": "POOR",    "reason": "Three forwards do not track back. Low block requires all ten outfield players behind the ball."},
            "4-2-3-1 Wide":     {"score": 62, "verdict": "DECENT",  "reason": "CAM creates a defensive hole. Wide players stretch the block rather than compressing it."},
            "4-2-3-1 Narrow":   {"score": 60, "verdict": "DECENT",  "reason": "Narrow shape compresses centrally but CAM refuses to defend and creates a structural gap."},
            "4-1-2-1-2 Wide":   {"score": 65, "verdict": "DECENT",  "reason": "Two strikers too high to maintain a genuine block. CDM helps but shape is not compact enough."},
            "4-1-2-1-2 Narrow": {"score": 62, "verdict": "DECENT",  "reason": "Strikers leave gaps. CDM helps compress centrally but two forwards undermine the block shape."},
            "4-4-1-1":          {"score": 82, "verdict": "GREAT",   "reason": "Four flat midfielders provide a solid and compact defensive block. CF drops to support."},
            "4-2-2-2":          {"score": 70, "verdict": "GOOD",    "reason": "Box midfield compact but two strikers positioned too high to maintain a coherent low block."},
            "4-3-1-2":          {"score": 60, "verdict": "DECENT",  "reason": "CAM and two strikers leave too many gaps. Three midfielders alone cannot close the block."},
            "4-3-2-1":          {"score": 58, "verdict": "DECENT",  "reason": "Too top-heavy to maintain a compact block. Two CFs refuse to drop and leave the shape exposed."},
            "4-5-1 Attack":     {"score": 85, "verdict": "GREAT",   "reason": "Five midfielders create an impenetrable mid-block. Most compact of the 4-back defensive shapes."},
            "3-4-1-2":          {"score": 72, "verdict": "GOOD",    "reason": "Three CBs provide security but wingbacks exposed wide when the block is under sustained pressure."},
            "3-4-2-1":          {"score": 70, "verdict": "GOOD",    "reason": "Three CBs solid but wingbacks leave wide gaps when pushed up. Two CFs too high for a true block."},
            "3-1-4-2":          {"score": 78, "verdict": "GOOD",    "reason": "CDM and three CBs create a solid defensive base. Four midfielders compress the block effectively."},
            "3-4-3":            {"score": 45, "verdict": "POOR",    "reason": "Three forwards leave massive gaps. Cannot maintain a genuine low block with this attacking shape."},
            "5-2-1-2":          {"score": 92, "verdict": "PERFECT", "reason": "Five defenders plus two CMs create a near-impenetrable block. Two strikers provide counter threat."},
            "5-2-2-1":          {"score": 94, "verdict": "PERFECT", "reason": "The ultimate low block shape. Five defenders and compact midfield make central penetration impossible."},
            "5-4-1 Flat":       {"score": 95, "verdict": "PERFECT", "reason": "Horizontal defensive lines are nearly impossible to break through. Peak low block compactness."},
            "5-4-1 Diamond":    {"score": 90, "verdict": "PERFECT", "reason": "Diamond compresses central zones brilliantly. Five defenders provide total defensive coverage."},
        }
    },

    "counter_attack": {
        "label": "Counter Attack",
        "icon": "⚔",
        "description": "Absorb pressure, explode in transition",
        "weights": {
            "pace_injection":    0.35,
            "stamina_decay":     0.20,
            "attribute_upgrade": 0.25,
            "impact_score":      0.15,
            "game_state":        0.05
        },
        "player_fit_formula": {
            "pace":                  0.35,
            "movement_sprint_speed": 0.30,
            "skill_dribbling":       0.20,
            "attacking_finishing":   0.15
        },
        "sub_language": {
            "urgency_phrase": "losing counter-attack threat",
            "sub_on_phrase":  "injects pace on the break",
        },
        "formation_scores": {
            "4-3-3":            {"score": 78, "verdict": "GOOD",    "reason": "Three forwards transition at pace but burn stamina tracking back. Counter threat diminishes after 60 minutes."},
            "4-4-2":            {"score": 72, "verdict": "GOOD",    "reason": "Two strikers run channels quickly in transition. Wide midfielders provide support on the break."},
            "4-2-3-1":         {"score": 80, "verdict": "GREAT",   "reason": "Wide players break quickly in transition. Double pivot recycles quickly to launch counters."},
            "3-5-2":            {"score": 78, "verdict": "GOOD",    "reason": "Two strikers run in behind from deep positions. Wingbacks bomb forward to support the counter."},
            "5-3-2":            {"score": 88, "verdict": "GREAT",   "reason": "Two strikers burst from a deep defensive block. Wingbacks provide wide outlet to stretch the counter."},
            "4-5-1":            {"score": 72, "verdict": "GOOD",    "reason": "Wide midfielders break effectively but lone striker is isolated without immediate support."},
            "4-4-2 Flat":       {"score": 85, "verdict": "GREAT",   "reason": "Quick wide outlets plus two strikers on the shoulder. Classic counter-attack shape with width and depth."},
            "4-3-3 Attack":     {"score": 75, "verdict": "GOOD",    "reason": "Three forwards transition at pace but high stamina cost limits counter effectiveness in the second half."},
            "4-2-3-1 Wide":     {"score": 82, "verdict": "GREAT",   "reason": "Wide players break quickly. Double pivot recycles possession to launch counters with pace and width."},
            "4-2-3-1 Narrow":   {"score": 70, "verdict": "GOOD",    "reason": "Vertical passing lines are direct but lack of width slows wide transition significantly."},
            "4-1-2-1-2 Wide":   {"score": 88, "verdict": "GREAT",   "reason": "Two strikers plus wide midfielders create devastating transition threat. CDM recycles quickly."},
            "4-1-2-1-2 Narrow": {"score": 82, "verdict": "GREAT",   "reason": "Direct vertical lines to two strikers. CAM links play quickly between defence and attack."},
            "4-4-1-1":          {"score": 78, "verdict": "GOOD",    "reason": "CF links play as target man, ST runs in behind. Classic two-tier counter-attack mechanism."},
            "4-2-2-2":          {"score": 90, "verdict": "PERFECT", "reason": "Two strikers plus two CAMs create devastating counter threat. Box midfield transitions at pace."},
            "4-3-1-2":          {"score": 80, "verdict": "GREAT",   "reason": "Vertical passing lines are direct and quick to two strikers. CAM adds link play in transition."},
            "4-3-2-1":          {"score": 72, "verdict": "GOOD",    "reason": "Two CFs break quickly but overall shape is slow to transition from build-up posture."},
            "4-5-1 Attack":     {"score": 70, "verdict": "GOOD",    "reason": "Wide midfielders provide counter outlet but lone striker too isolated to lead the break alone."},
            "3-4-1-2":          {"score": 85, "verdict": "GREAT",   "reason": "Wingbacks bomb forward to support two strikers. Three CBs provide security on the counter."},
            "3-4-2-1":          {"score": 82, "verdict": "GREAT",   "reason": "Two CFs run in behind while wingbacks provide width. Three CBs hold defensive shape."},
            "3-1-4-2":          {"score": 80, "verdict": "GREAT",   "reason": "Four midfielders transition quickly to support two strikers. CDM recycles to launch counters."},
            "3-4-3":            {"score": 78, "verdict": "GOOD",    "reason": "Three forwards break at pace but three CBs exposed if counter breaks down in transition."},
            "5-2-1-2":          {"score": 85, "verdict": "GREAT",   "reason": "Two strikers burst from a deep block. Wingbacks provide wide outlet to stretch opposition."},
            "5-2-2-1":          {"score": 80, "verdict": "GREAT",   "reason": "Two CFs break from deep while wingbacks provide width. Compact base makes counters difficult to stop."},
            "5-4-1 Flat":       {"score": 72, "verdict": "GOOD",    "reason": "Wide midfielders provide counter outlet but lone striker too isolated without immediate support."},
            "5-4-1 Diamond":    {"score": 75, "verdict": "GOOD",    "reason": "CAM links quickly to lone striker. Diamond compresses centrally before releasing on the counter."},
        }
    },

    "direct_play": {
        "label": "Direct Play",
        "icon": "🎯",
        "description": "Win second balls, use target man",
        "weights": {
            "aerial_presence":   0.30,
            "physical_strength": 0.25,
            "attribute_upgrade": 0.25,
            "impact_score":      0.15,
            "stamina_decay":     0.05
        },
        "player_fit_formula": {
            "attacking_heading_accuracy": 0.30,
            "power_jumping":              0.25,
            "power_strength":             0.25,
            "attacking_finishing":        0.20
        },
        "sub_language": {
            "urgency_phrase": "losing aerial threat",
            "sub_on_phrase":  "adds target man presence",
        },
        "formation_scores": {
            "4-3-3":            {"score": 52, "verdict": "DECENT",  "reason": "Too possession-oriented by design. Forwards prefer combination play over direct ball reception."},
            "4-4-2":            {"score": 92, "verdict": "PERFECT", "reason": "Two strikers as target men with wide support. The quintessential direct play shape historically."},
            "4-2-3-1":         {"score": 60, "verdict": "DECENT",  "reason": "Too structured and possession-focused for direct play. CAM prefers feet not direct balls over the top."},
            "3-5-2":            {"score": 78, "verdict": "GOOD",    "reason": "Direct ball to two strikers with wingbacks providing wide outlet. Effective but telegraphic."},
            "5-3-2":            {"score": 70, "verdict": "GOOD",    "reason": "Direct to two strikers from deep positions. Wingbacks provide wide target for long distribution."},
            "4-5-1":            {"score": 42, "verdict": "POOR",    "reason": "Lone striker cannot win direct balls consistently without support. Shape too narrow for direct play."},
            "4-4-2 Flat":       {"score": 92, "verdict": "PERFECT", "reason": "The quintessential direct play shape. Two target men with wide midfield support on second balls."},
            "4-3-3 Attack":     {"score": 50, "verdict": "POOR",    "reason": "Too possession-oriented. Forwards prefer combination play over direct ball reception."},
            "4-2-3-1 Wide":     {"score": 55, "verdict": "DECENT",  "reason": "Too structured for direct play. Wide players want the ball to feet not over the top."},
            "4-2-3-1 Narrow":   {"score": 50, "verdict": "POOR",    "reason": "Narrow shape too intricate for direct play. No wide targets to exploit direct distribution."},
            "4-1-2-1-2 Wide":   {"score": 85, "verdict": "GREAT",   "reason": "Direct to two strikers with wide midfield support. CDM recycles second balls effectively."},
            "4-1-2-1-2 Narrow": {"score": 80, "verdict": "GREAT",   "reason": "Narrow direct play through the centre. Two strikers as vertical targets with CAM link."},
            "4-4-1-1":          {"score": 88, "verdict": "GREAT",   "reason": "CF as target man, ST runs off the knock-down. Classic direct play mechanism with two layers."},
            "4-2-2-2":          {"score": 82, "verdict": "GREAT",   "reason": "Direct to two strikers with two CAMs supporting second balls. Box midfield wins aerial duels."},
            "4-3-1-2":          {"score": 72, "verdict": "GOOD",    "reason": "Direct to two strikers through central channels. Narrow but effective vertical play."},
            "4-3-2-1":          {"score": 55, "verdict": "DECENT",  "reason": "Too intricate by design. Two CFs prefer combination play over direct ball reception."},
            "4-5-1 Attack":     {"score": 40, "verdict": "POOR",    "reason": "Lone striker cannot sustain direct play alone. Five midfielders too passive to support second balls."},
            "3-4-1-2":          {"score": 80, "verdict": "GREAT",   "reason": "Direct to two strikers with CAM link play. Wingbacks provide wide outlet for second phase."},
            "3-4-2-1":          {"score": 75, "verdict": "GOOD",    "reason": "Direct to two CFs who link with ST. Wingbacks provide width for second ball situations."},
            "3-1-4-2":          {"score": 75, "verdict": "GOOD",    "reason": "Direct to two strikers through CDM pivot. Four midfielders contest second balls effectively."},
            "3-4-3":            {"score": 60, "verdict": "DECENT",  "reason": "Three forwards prefer combination play. Direct play works but is not the natural mechanism."},
            "5-2-1-2":          {"score": 78, "verdict": "GOOD",    "reason": "Direct to two strikers from deep positions. Wingbacks provide wide target for long distribution."},
            "5-2-2-1":          {"score": 72, "verdict": "GOOD",    "reason": "Direct to lone striker with CF support. Wingbacks stretch play for second ball situations."},
            "5-4-1 Flat":       {"score": 55, "verdict": "DECENT",  "reason": "Lone striker cannot sustain direct play without support. Wide mids provide outlet but shape is too deep."},
            "5-4-1 Diamond":    {"score": 58, "verdict": "DECENT",  "reason": "CAM adds link play but lone striker still isolated for sustained direct play."},
        }
    },

    "structured_press": {
        "label": "Structured Press",
        "icon": "🔄",
        "description": "Coordinated press with defensive shape",
        "weights": {
            "press_reliability":    0.25,
            "positional_integrity": 0.25,
            "attribute_upgrade":    0.25,
            "impact_score":         0.15,
            "stamina_decay":        0.10
        },
        "player_fit_formula": {
            "power_stamina":           0.25,
            "mentality_vision":        0.25,
            "pace":                    0.25,
            "attacking_short_passing": 0.25
        },
        "sub_language": {
            "urgency_phrase": "pressing structure losing coordination",
            "sub_on_phrase":  "restores press structure",
        },
        "formation_scores": {
            "4-3-3":            {"score": 85, "verdict": "GREAT",   "reason": "Three forwards set press triggers. Midfield trio compresses centrally in coordinated waves."},
            "4-4-2":            {"score": 78, "verdict": "GOOD",    "reason": "Midfield line presses as a disciplined unit. Two strikers initiate the press from the front."},
            "4-2-3-1":         {"score": 94, "verdict": "PERFECT", "reason": "CAM presses the pivot, wide players press wide CBs. The most tactically coherent structured press shape."},
            "3-5-2":            {"score": 75, "verdict": "GOOD",    "reason": "Five-man midfield overload presses passing lanes effectively. Wingbacks press wide triggers simultaneously."},
            "5-3-2":            {"score": 38, "verdict": "RISKY",   "reason": "Back 5 cannot commit to a structured press without leaving catastrophic space in behind."},
            "4-5-1":            {"score": 70, "verdict": "GOOD",    "reason": "Five midfielders press as a compact unit in a mid-block. Effective but not a high press."},
            "4-4-2 Flat":       {"score": 75, "verdict": "GOOD",    "reason": "Midfield line presses as a disciplined unit. Two strikers initiate the press from the front effectively."},
            "4-3-3 Attack":     {"score": 88, "verdict": "GREAT",   "reason": "Three forwards set coordinated press triggers. Midfield trio compresses passing lanes in waves."},
            "4-2-3-1 Wide":     {"score": 90, "verdict": "PERFECT", "reason": "Width presses wide CBs, CAM presses the pivot. Tactically the most coherent structured press shape."},
            "4-2-3-1 Narrow":   {"score": 88, "verdict": "GREAT",   "reason": "Central overload presses all passing lanes simultaneously. Suffocates opposition build-up centrally."},
            "4-1-2-1-2 Wide":   {"score": 82, "verdict": "GREAT",   "reason": "Diamond midfield presses as a tight coordinated unit. Two strikers lead the press from front."},
            "4-1-2-1-2 Narrow": {"score": 85, "verdict": "GREAT",   "reason": "Most compact pressing shape in 4-back formations. Central overload suffocates the opposition pivot."},
            "4-4-1-1":          {"score": 72, "verdict": "GOOD",    "reason": "CF presses as first trigger, flat four press as second wave. Two-tier structured press mechanism."},
            "4-2-2-2":          {"score": 78, "verdict": "GOOD",    "reason": "Box midfield presses as a tight unit. Two strikers lead the press with two CAMs supporting."},
            "4-3-1-2":          {"score": 85, "verdict": "GREAT",   "reason": "Three CMs plus CAM presses all central passing lanes. Two strikers initiate the press trigger."},
            "4-3-2-1":          {"score": 90, "verdict": "PERFECT", "reason": "Three midfield layers press in coordinated waves. The Christmas Tree structure is built for this."},
            "4-5-1 Attack":     {"score": 68, "verdict": "DECENT",  "reason": "Five midfielders press effectively in a mid-block but lack a genuine high press trigger forward."},
            "3-4-1-2":          {"score": 78, "verdict": "GOOD",    "reason": "CAM presses the pivot while midfield presses as a unit. Wingbacks press wide triggers effectively."},
            "3-4-2-1":          {"score": 80, "verdict": "GREAT",   "reason": "Two CFs press in the first wave, midfield presses in the second. Well-structured two-tier press."},
            "3-1-4-2":          {"score": 70, "verdict": "GOOD",    "reason": "CDM anchoring deep confuses the press structure but four midfielders cover pressing lanes well."},
            "3-4-3":            {"score": 85, "verdict": "GREAT",   "reason": "Three forwards set press triggers simultaneously. Four midfielders press in coordinated support."},
            "5-2-1-2":          {"score": 48, "verdict": "POOR",    "reason": "Too deep to structure a meaningful press. Five defenders stranded behind the pressing line."},
            "5-2-2-1":          {"score": 42, "verdict": "POOR",    "reason": "Cannot press from this depth. Five defenders leave insufficient numbers forward to press with structure."},
            "5-4-1 Flat":       {"score": 45, "verdict": "POOR",    "reason": "Mid-block possible but five defenders cannot commit forward. Not a genuine structured press."},
            "5-4-1 Diamond":    {"score": 52, "verdict": "DECENT",  "reason": "CDM and CAM can set a mid-press structure but five defenders limit genuine pressing ambition."},
        }
    }
}


def get_compatibility(playstyle: str, formation: str) -> dict:
    """Return compatibility score, verdict, and modifier for a playstyle+formation combo."""
    profile = PLAYSTYLES.get(playstyle, PLAYSTYLES["high_press"])
    compat = profile["formation_scores"].get(formation, {
        "score": 65, "verdict": "UNKNOWN", "reason": "No data for this formation."
    })
    score = compat["score"]

    if score >= 90:   modifier = 1.12
    elif score >= 80: modifier = 1.05
    elif score >= 70: modifier = 1.00
    elif score >= 55: modifier = 0.90
    elif score >= 40: modifier = 0.78
    else:             modifier = 0.65

    best_formation = max(
        profile["formation_scores"],
        key=lambda f: profile["formation_scores"][f]["score"]
    )

    return {
        "score":                    score,
        "verdict":                  compat["verdict"],
        "reason":                   compat["reason"],
        "win_probability_modifier": modifier,
        "is_conflict":              score < 50,
        "recommended_formation":    best_formation,
    }


def get_player_playstyle_fit(player: dict, playstyle: str) -> float:
    """Score 0–100: how well this player fits the playstyle's requirements."""
    profile = PLAYSTYLES.get(playstyle, PLAYSTYLES["high_press"])
    formula = profile["player_fit_formula"]
    score = 0.0
    for attr, weight in formula.items():
        if attr == "work_rate_att":
            wr = player.get("work_rate_att", "Medium")
            val = {"High": 90, "Medium": 65, "Low": 40}.get(wr, 65)
        else:
            val = float(player.get(attr, 65))
        score += val * weight
    return round(score, 1)
