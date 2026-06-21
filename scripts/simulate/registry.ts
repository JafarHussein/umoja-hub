// Side-effect imports that register every model the engine creates, so the reset
// path can resolve them by name via mongoose.model(name).deleteMany(). Listed
// once here as the authoritative set of collections a run touches.

import '../../src/lib/models/User.model';
import '../../src/lib/models/Institution.model';
import '../../src/lib/models/NgoOrganization.model';
import '../../src/lib/models/VerifiedSupplier.model';
import '../../src/lib/models/FarmerGroup.model';
import '../../src/lib/models/MarketplaceListing.model';
import '../../src/lib/models/Order.model';
import '../../src/lib/models/EscrowEventLog.model';
import '../../src/lib/models/PriceHistory.model';
import '../../src/lib/models/Rating.model';
import '../../src/lib/models/WithdrawalRequest.model';
import '../../src/lib/models/MediationRequest.model';
import '../../src/lib/models/ProjectEngagement.model';
import '../../src/lib/models/PeerReview.model';
import '../../src/lib/models/LecturerReview.model';
import '../../src/lib/models/LecturerEffectiveness.model';
import '../../src/lib/models/StudentPortfolioStatus.model';
import '../../src/lib/models/VerificationAuditLog.model';
import '../../src/lib/models/PortfolioView.model';
import '../../src/lib/models/Notification.model';
import '../../src/lib/models/SimulationRun.model';
