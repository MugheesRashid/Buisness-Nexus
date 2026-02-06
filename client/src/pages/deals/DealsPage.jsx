import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import dealApi from "../../services/dealApi";
import toast from "react-hot-toast";

const deals = [
  {
    id: 1,
    startup: {
      name: "TechWave AI",
      logo: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
      industry: "FinTech",
    },
    amount: "$1.5M",
    equity: "15%",
    status: "Due Diligence",
    stage: "Series A",
    lastActivity: "2024-02-15",
  },
  {
    id: 2,
    startup: {
      name: "GreenLife Solutions",
      logo: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
      industry: "CleanTech",
    },
    amount: "$2M",
    equity: "20%",
    status: "Term Sheet",
    stage: "Seed",
    lastActivity: "2024-02-10",
  },
  {
    id: 3,
    startup: {
      name: "HealthPulse",
      logo: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",
      industry: "HealthTech",
    },
    amount: "$800K",
    equity: "12%",
    status: "Negotiation",
    stage: "Pre-seed",
    lastActivity: "2024-02-05",
  },
];

export const DealsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [investingDeal, setInvestingDeal] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [stats, setStats] = useState({
    totalInvestment: 0,
    activeDeals: 0,
    portfolioCompanies: 0,
    closedThisMonth: 0,
  });

  const statuses = ["Open", "Closed", "Cancelled"];

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [deals, user]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response =
        user?.role === "entrepreneur"
          ? await dealApi.getMyDeals()
          : await dealApi.getDeals();
      setDeals(response);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (status) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "primary";
      case "Closed":
        return "success";
      case "Cancelled":
        return "error";
      default:
        return "gray";
    }
  };

  const calculateStats = () => {
    if (!deals.length) return;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (user?.role === "investor") {
      // Investor stats
const userId = user?._id?.toString?.();
console.log(user)
console.log(deals)
const totalInvestment = deals.reduce((sum, deal) => {
  const dealSum = deal.investors?.reduce((s, inv) => {
    if (inv.investor?._id === user.id) {
      return s + (inv.amount || 0);
    }
    return s;
  }, 0);

  return sum + dealSum;
}, 0);


      console.log("Total Investment:", totalInvestment);

      const activeDeals = deals.filter((deal) => deal.status === "Open").length;

      const portfolioCompanies = deals.filter((deal) =>
        deal.investors?.some(
          (inv) => inv.investor._id.toString() === user.id.toString(),
        ),
      ).length;

      const closedThisMonth = deals.filter((deal) => {
        if (deal.status !== "Closed") return false;
        const myInvestment = deal.investors?.find(
          (inv) => inv.investor._id.toString() === user.id.toString(),
        );
        if (!myInvestment) return false;
        const investedDate = new Date(myInvestment.investedAt);
        return (
          investedDate.getMonth() === currentMonth &&
          investedDate.getFullYear() === currentYear
        );
      }).length;

      setStats({
        totalInvestment,
        activeDeals,
        portfolioCompanies,
        closedThisMonth,
      });
    } else {
      // Entrepreneur stats
      const totalInvestment = deals.reduce(
        (sum, deal) => sum + (deal.amountRaised || 0),
        0,
      );
      const activeDeals = deals.filter((deal) => deal.status === "Open").length;
      const portfolioCompanies = deals.length;
      const closedThisMonth = deals.filter((deal) => {
        if (deal.status !== "Closed") return false;
        const closedDate = new Date(deal.updatedAt);
        return (
          closedDate.getMonth() === currentMonth &&
          closedDate.getFullYear() === currentYear
        );
      }).length;

      setStats({
        totalInvestment,
        activeDeals,
        portfolioCompanies,
        closedThisMonth,
      });
    }
  };

  const handleInvest = async (dealId) => {
    if (!investmentAmount || investmentAmount <= 0) {
      toast.error("Please enter a valid investment amount");
      return;
    }

    try {
      await dealApi.investInDeal(dealId, parseFloat(investmentAmount));
      toast.success("Investment successful!");
      setInvestingDeal(null);
      setInvestmentAmount("");
      fetchDeals(); // Refresh deals
    } catch (error) {
      toast.error("Failed to invest: " + error.message);
    }
  };

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = deal.startupName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus.length === 0 || selectedStatus.includes(deal.status);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Deals</h1>
          <p className="text-gray-600">
            Track and manage your investment pipeline
          </p>
        </div>

        <Button onClick={() => navigate("/deals/create")}>Add Deal</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Investment</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${stats.totalInvestment.toLocaleString()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg mr-3">
                <TrendingUp size={20} className="text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.activeDeals}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-lg mr-3">
                <Users size={20} className="text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Portfolio Companies</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.portfolioCompanies}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-lg mr-3">
                <Calendar size={20} className="text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Closed This Month</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.closedThisMonth}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search deals by startup name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={<Search size={18} />}
            fullWidth
          />
        </div>

        <div className="w-full md:w-1/3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <Badge
                  key={status}
                  variant={
                    selectedStatus.includes(status)
                      ? getStatusColor(status)
                      : "gray"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleStatus(status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deals table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Active Deals</h2>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Startup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading deals...
                    </td>
                  </tr>
                ) : filteredDeals.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No deals found
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => (
                    <tr key={deal._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            src={
                              deal.startupOwner?.logo ||
                              "https://via.placeholder.com/40"
                            }
                            alt={deal.startupName}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {deal.startupName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {deal.startupOwner?.name || "Unknown Owner"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${deal.amountRaised?.toLocaleString() || 0} / $
                          {deal.targetAmount?.toLocaleString() ||
                            deal.maxAmount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {deal.equity}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusColor(deal.status)}>
                          {deal.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {deal.isNegotiationAllowed ? "Negotiable" : "Fixed"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/deals/${deal._id}`)}
                          >
                            View Details
                          </Button>
                          {user?.role === "investor" &&
                            deal.status === "Open" && (
                              <Button
                                size="sm"
                                onClick={() => setInvestingDeal(deal._id)}
                              >
                                Invest
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Investment Modal */}
      {investingDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                Invest in Deal
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="investmentAmount"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Investment Amount ($)
                  </label>
                  <Input
                    id="investmentAmount"
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    fullWidth
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInvestingDeal(null);
                      setInvestmentAmount("");
                    }}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => handleInvest(investingDeal)} fullWidth>
                    Confirm Investment
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
