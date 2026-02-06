import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { fetchInvestors } from '../../services/userApi';

export const InvestorsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInvestors = async () => {
      try {
        setLoading(true);
        const data = await fetchInvestors();
        setInvestors(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInvestors();
  }, []);

  // Get unique investment stages, interests, and locations
  const allStages = Array.from(new Set(investors.flatMap(i => i.investmentStage)));
  const allInterests = Array.from(new Set(investors.flatMap(i => i.investmentInterests)));
  const allLocations = Array.from(new Set(investors.map(i => i.location)));

  // Filter investors based on search and filters
  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = searchQuery === '' ||
      (investor.name && investor.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (investor.bio && investor.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (investor.investmentInterests && investor.investmentInterests.some(interest =>
        interest.toLowerCase().includes(searchQuery.toLowerCase())
      ));

    const matchesStages = selectedStages.length === 0 ||
      (investor.investmentStage && investor.investmentStage.some(stage => selectedStages.includes(stage)));

    const matchesInterests = selectedInterests.length === 0 ||
      (investor.investmentInterests && investor.investmentInterests.some(interest => selectedInterests.includes(interest)));

    const matchesLocation = selectedLocations.length === 0 ||
      selectedLocations.includes(investor.location);

    return matchesSearch && matchesStages && matchesInterests && matchesLocation;
  });

  const toggleStage = (stage) => {
    setSelectedStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading investors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Investors</h1>
        <p className="text-gray-600">Connect with investors who match your startup's needs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Stage</h3>
                <div className="space-y-2">
                  {allStages.map(stage => (
                    <button
                      key={stage}
                      onClick={() => toggleStage(stage)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedStages.includes(stage)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {allInterests.map(interest => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? 'primary' : 'gray'}
                      className="cursor-pointer"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

            </CardBody>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search investors by name, interests, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />

            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {filteredInvestors.length} results
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredInvestors.map(investor => (
              <InvestorCard
                key={investor._id}
                investor={investor}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
