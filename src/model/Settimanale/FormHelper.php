<?php

declare(strict_types=1);

/**
 * This file is part of the Firstance BPER project.
 *
 * @copyright Firstance srl.
 */

namespace FirstAdvisory\FAWill\model\Settimanale;

use Exception;
use PDO;
use Throwable;
use TraitTryQuery;

class FormHelper
{
    use TraitTryQuery;

    private const LIMIT = 20;
    private const MIN_QUERY_LENGTH = 2;

    public function __construct(PDO $conn)
    {
        $this->setConnect($conn);
    }

    /**
     * @param string $field
     * @param string $query
     * @param array<string, string> $context
     * @return list<array<string, string|null>>
     * @throws Throwable
     */
    public function search(string $field, string $query, array $context = []): array
    {
        // Per fund_code con contesto, accetta query vuota
        if (strlen($query) < self::MIN_QUERY_LENGTH && $field !== 'fund_code') {
            throw new Exception('La query deve contenere almeno ' . self::MIN_QUERY_LENGTH . ' caratteri');
        }

        switch ($field) {
            case 'company':
                return $this->searchCompany($query);
            case 'policy_number':
                return $this->searchPolicy($query, $context);
            case 'fund_code':
                return $this->searchFund($query, $context);
            default:
                throw new Exception('Campo non supportato per autocomplete: ' . $field);
        }
    }

    /**
     * @param string $query
     * @return list<array{value: string, label: string}>
     * @throws Throwable
     */
    private function searchCompany(string $query): array
    {
        $sql = "SELECT name
                FROM company
                WHERE name ILIKE '%' || :subText || '%'
                   OR old_jfad_code ILIKE '%' || :subText || '%'
                ORDER BY name
                LIMIT " . self::LIMIT;

        $stmt = $this->tryQuery($sql, [':subText' => $query]);
        $results = $this->getQueryRecords($stmt);

        if ($results === false) {
            return [];
        }

        return array_map(fn(array $row): array => [
            'value' => $row['name'],
            'label' => $row['name']
        ], $results);
    }

    /**
     * @param string $query
     * @param array<string, string> $context
     * @return list<array{value: string, label: string}>
     * @throws Throwable
     */
    private function searchPolicy(string $query, array $context = []): array
    {
        $limit = self::LIMIT;
        $bindings = [':subText' => $query];
        $addCompanyFilter = 'true';
        $join = '';

        if (!empty($context['company'])) {
            $addCompanyFilter = 'cy.name = :company';
            $bindings[':company'] = $context['company'];
            $join = 'inner join company cy on vls.company_id = cy.id';
        }

        $sql = <<<EOF
                    SELECT distinct code_company
                      FROM view_contract_latest_signatory vls
                      $join
                     WHERE code_company ILIKE '%' || :subText || '%'
                       and $addCompanyFilter
                     ORDER BY code_company
                     LIMIT $limit
        EOF;

        $results = $this->tryQuery($sql, $bindings)->fetchAll(PDO::FETCH_ASSOC) ?? [];

        return array_map(fn(array $row): array => [
            'value' => $row['code_company'],
            'label' => $row['code_company']
        ], $results);
    }

    /**
     * @param string $query
     * @param array<string, string> $context
     * @return list<array{value: string, label: string, description: string, fund_type: string|null}>
     * @throws Throwable
     */
    private function searchFund(string $query, array $context = []): array
    {
        $limit = self::LIMIT;
        $bindings = [':subText' => $query];
        $results = [];

        if (!empty($context['policy_number'])) {
            $sql = <<<SQL
                select cf.fund_code as code, cf.description, pft.code_1 as fund_type
                  from contract c
                 inner join contract_fund cf on c.id = cf.contract_id
                 inner join param_fund_type pft on cf.param_fund_type_id = pft.id
                 where c.code_company = :policy_number
                   and (cf.fund_code ilike '%' || :subText || '%' or cf.description ilike '%' || :subText || '%')
                 LIMIT $limit
            SQL;

            $bindings[':policy_number'] = $context['policy_number'];
            $results = $this->tryQuery($sql, $bindings)->fetchAll(PDO::FETCH_ASSOC) ?? [];
        }
        if (count($results) === 0) {
            if (!empty($context['company'])) {
                $companyFilter = <<<EOF
                    f.company_id in (select id from company c where c.name = :company) 
                EOF;

                $bindings[':company'] = $context['company'];
            } else {
                $companyFilter = 'true';
            }

            $sql = <<<SQL
                SELECT f.code, f.description, pft.code_1 as fund_type
                  FROM fund f
                 inner join param_fund_type pft ON f.param_fund_type_id = pft.id
                 WHERE f.code ILIKE '%' || :subText || '%'
                   and $companyFilter
                 ORDER BY f.code
                 LIMIT $limit
            SQL;

            $results = $this->tryQuery($sql, $bindings)->fetchAll(PDO::FETCH_ASSOC) ?? [];
        }

        return array_map(fn(array $row): array => [
            'value' => $row['code'],
            'label' => $row['code'],
            'description' => $row['description'],
            'fund_type' => $row['fund_type'] ?? null
        ], $results);
    }
}
