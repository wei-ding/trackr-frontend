define(['lodash'], function(_) {
    'use strict';
    return ['$stateParams', '$scope', 'Restangular', '$state', '$filter', function($stateParams, $scope, Restangular, $state, $filter) {
        $scope.errors = [];
        /**
         * Show or hide the form for a new contact person for this company
         * @param show true/false = show/hide
         */
        $scope.doShowContactPersonForm = function(show) {
            $scope.showContactPersonForm = show;
        };

        /**
         * POST the entered contact person to the server.
         * This method adds the company relationship to the contact person.
         */
        $scope.saveNewContactPerson = function() {
            //Add the company relationship to the person
            $scope.newContactPerson.company = $scope.company._links.self.href;
            Restangular.all('contactPersons').post($scope.newContactPerson).then(function(result) {
                $scope.newContactPerson = {};
                $scope.contactPersons.push(result);
                $scope.doShowContactPersonForm(false);
            }, function(response) {
                $scope.contactPersonErrors = response.data.errors;
            });
        };

        /**
         * Delete a contact person from this company by issuing a DELETE to the API
         * @param contactPerson The contact person to delete
         */
        $scope.removeContactPerson = function(contactPerson) {
            /*
             We cant use the contactPerson object directly because it is tied to the company.
             Restangular would execute DELETE '/api/companies/0/contactPersons/0' which is not what we want
             */
            Restangular.one('contactPersons', contactPerson.id).remove().then(function() {
                _.remove($scope.contactPersons, function(cP) {
                    return cP.id === contactPerson.id;
                });
            });
        };

        $scope.companyIdChanged = function() {
            //Change the company id in the list in the parent controller
            var companyInList = _.find($scope.$parent.companies, {id: $scope.company.id});
            companyInList.companyId = $scope.company.companyId;
            //reload so the url is correct
            $state.go('trackr.administration.companies.edit', {id: $scope.company.companyId});
        };

        /**
         * Gets called when there's an error changing the company ID. Returns an error when there was a
         * conflict, i.e. the companyID is in use.
         * @param response The HTTP response for the failed call
         * @returns {*} An error array if the status is 409, undefined otherwise.
         */
        $scope.companyIdError = function(response) {
            if(response.status === 409) {
                return [{
                    entity: 'company',
                    message: $filter('translate')('COMPANY.COMPANY_ID_CONFLICT'),
                    property: 'companyId'
                }];
            }
            return undefined;
        };

        /*
         Initialization of $scope objects
         */
        $scope.contactPersonErrors = [];
        $scope.newContactPerson = {};
        $scope.doShowContactPersonForm(false);
        Restangular.allUrl('companies', 'api/companies/search/findByCompanyId').getList({companyId: $stateParams.id}).then(function(companies) {
            //TODO: why does spring return an array? The method signature is a single entity.
            var company = companies[0];

            $scope.company = company;
            company.customGET('address').then(function(address) {
                $scope.address = address;
            });
            company.getList('contactPersons').then(function(contactPersons) {
                $scope.contactPersons = contactPersons;
            });
        });
    }];
});