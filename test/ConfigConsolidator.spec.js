const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const expect = chai.expect;
chai.use(chaiAsPromised);

const Color = require('color');

const fixtures = require('./fixtures/configFixtures');
const ConfigConsolidator = require('../ConfigConsolidator');

describe('A ConfigConsolidator class', () => {

  describe('an instantiated object', () => {

    let configConsolidator;

    beforeEach(() => {
      configConsolidator = new ConfigConsolidator();
    });

    describe('loadConfigs method', () => {

      context('when not supplied an array', () => {

        it('throws with the message "loadConfigs must he supplied with an array"', () => {
          expect(() => {
            configConsolidator.loadConfigs(null);
          }).to.throw('loadConfigs must he supplied with an array');
        })

      });

      context('when supplied an array', () => {

        it('does not throw with the message "loadConfigs must he supplied with an array"', () => {
          expect(() => {
            configConsolidator.loadConfigs([]);
          }).not.to.throw('loadConfigs must he supplied with an array');
        });

        context('when a value in the supplied array does not resolve to a file system path', () => {

          it('throws with a "Cannot find module" message', () => {
            expect(() => {
              configConsolidator.loadConfigs(['./path/to/non-existent/file']);
            }).to.throw(/Cannot find module/);
          })

        });

        context('when all values in the supplied array resolve to a file system path', () => {

          it('does not throw', () => {
            expect(() => {
              configConsolidator.loadConfigs(['configFixtures.js'], `${__dirname}/fixtures/`)
            }).not.to.throw();
          });

        })

      });

    });

    describe('mergeConfigs method', () => {

      let firstConfig;
      let secondConfig;
      let merged;

      beforeEach(() => {
        firstConfig = fixtures.configsToMerge.firstConfig;
        secondConfig = fixtures.configsToMerge.secondConfig;
        merged = configConsolidator.mergeConfigs([firstConfig, secondConfig]);

      });

      it('performs a deep merge using a list of config objects', () => {
        expect(merged.objects).to.have.lengthOf(6);
        expect(merged.objects[0]).to.deep.equal(firstConfig.data.objects[0]);
        expect(merged.objects[1]).to.deep.equal(firstConfig.data.objects[1]);
        expect(merged.objects[2]).to.deep.equal(firstConfig.data.objects[2]);
        expect(merged.objects[3]).to.deep.equal(secondConfig.data.objects[0]);
        expect(merged.objects[4]).to.deep.equal(secondConfig.data.objects[1]);
        expect(merged.objects[5]).to.deep.equal(secondConfig.data.objects[2]);
        expect(merged.objects[6]).to.deep.equal(secondConfig.data.objects[3]);
        expect(merged.additionalProperty).to.equal(secondConfig.data.additionalProperty);
      });

      it('ignores instances of Color', () => {
        expect(merged.color).to.be.an.instanceOf(Color);
      });

      context('when passed object properties that would cause a merge conflict', () => {

        it('the one passed last wins', () => {
          expect(merged.clash).to.equal(secondConfig.data.clash);
        });

      });

    });

    describe('allocateToLayers method', () => {

      let allConfigsAllocations;
      let mergedAllocations;

      beforeEach(() => {
        allConfigsAllocations = fixtures.configLayerAllocations;
        mergedAllocations = configConsolidator.allocateToLayers(allConfigsAllocations);
      });

      it('correctly merges allocations from all configs', () => {
        expect(mergedAllocations.sass).to.be.an('array').that.has.a.lengthOf(3);
        expect(mergedAllocations.sass).to.include('breakpoints');
        expect(mergedAllocations.sass).to.include('colors');
        expect(mergedAllocations.sass).to.include('grid');

        expect(mergedAllocations.js).to.be.an('array').that.has.a.lengthOf(2);
        expect(mergedAllocations.js).to.include('breakpoints');
        expect(mergedAllocations.js).to.include('colors');

        expect(mergedAllocations.template).to.be.an('array').that.has.a.lengthOf(1);
        expect(mergedAllocations.template).to.include('grid');
      });

    });

  });

  describe('processDeferredConfig static method', () => {

    let configWithNoDeferrals;
    let configWithDeferrals;

    beforeEach(() => {
      configWithNoDeferrals = fixtures.configWithNoDeferrals;
      configWithDeferrals = fixtures.configWithDeferrals;
    });

    context('when passed config containing a value beginning "!expression"', () => {

      it('evaluates that expression within the context of config', () => {
        return expect(
          ConfigConsolidator.processDeferredConfig(configWithDeferrals)
        ).to.eventually.have.own.property('derivedValue', 300);
      });

    });

    context('when passed config containing a value not beginning "!expression"', () => {

      it('passes that value through unchanged', () => {
        return expect(
          ConfigConsolidator.processDeferredConfig(configWithNoDeferrals)
        ).to.eventually.have.own.property('stringProperty', 'string property');
      });

    });

  });

});
