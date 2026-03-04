<?php /** @noinspection PhpIllegalPsrClassPathInspection */

/**
 * Trait TraitTryQuery
 *
 * $this->connection DB Connection
 *
 */
trait TraitTryQuery
{
    private ?PDO $connection = null;

    private array $stackQuery = [];

    private function setConnect(PDO $connection): void
    {
        $this->connection = $connection;
    }

    /**
     * @return PDO
     */
    private function getConnect(): PDO
    {
        if ($this->connection instanceof PDO)
            {return $this->connection;}
        else
            {throw new PDOException('TraitTryQuery is not initialized. Probably is missed a lene like $this->setConnect( $myDbConnection );');}
    }

    /**
     * @param string $stmt
     * @param array $values
     */
    private function addQueryInStack(string $stmt, array $values = []): void
    {
        $this->stackQuery[] = ['smtp' => $stmt, 'values' => $values];
    }

    /**
     * @param bool $transaction
     */
    private function tryQueryStack(bool $transaction = true): void
    {
        $i = -1;
        try {
            if ($transaction && !$this->getConnect()->inTransaction()) {
                $this->getConnect()->beginTransaction();
            }
            foreach ($this->stackQuery as $i => $tryQuery) {
                $stmt = $this->tryQuery($tryQuery['smtp'], $tryQuery['values'], false);
                unset($stmt);
            }
            if ($transaction || $this->getConnect()->inTransaction()) {
                $this->getConnect()->commit();
            }
        } catch (Throwable $t) {
            if ($transaction || $this->getConnect()->inTransaction()) {
                $this->getConnect()->rollBack();
            }
            $message = ($i === -1)? $t->getMessage() : $t->getMessage() . ' *** ' . $this->stackQuery[$i];
            // Only for debug
            if (ENV_IS_DEV) echo $this->stackQuery[$i];
            throw new PDOException($message, (int)$t->getCode(), $t);
        } finally {
            $this->stackQuery = [];
        }
    }

    /**
     * @param string $stmt
     * @param array $values
     * @param bool $transaction
     * @return PDOStatement|null
     */
    private function tryQuery(string $stmt, array $values = [], bool $transaction = true): ?PDOStatement
    {
        try {
            if ($transaction && !$this->getConnect()->inTransaction()) {
                $this->getConnect()->beginTransaction();
            }
            switch (strtolower(trim($stmt))) {
                case 'commit':
                    $this->getConnect()->commit();
                    break;
                case 'rollback':
                    $this->getConnect()->rollBack();
                    break;
                default:
                    if (count($values) > 0) {
                        $statement = $this->getConnect()->prepare($stmt);
                        $statement->execute($values);
                    } else {
                        $statement = $this->getConnect()->query($stmt);
                    }
                    if ($transaction && $this->getConnect()->inTransaction()) {
                        $this->getConnect()->commit();
                    }
                    return $statement;
            }
            return null;

        } catch (Throwable $t) {
            if ($transaction && $this->getConnect()->inTransaction()) {
                $this->getConnect()->rollBack();
            }
            // Only for debug
            if (ENV_IS_DEV) echo '<pre>' . $t->getMessage() . '<br><hr>' . $stmt . '</pre>';
            throw new PDOException($t->getMessage() . ' *** ' . $stmt, (int)$t->getCode(), $t);
        }
    }

    /**
     * @param string $stmt
     * @param array $rows
     * @param bool $transaction
     * @return int number af row(s) affected
     */
    private function tryQuerySequences(string $stmt, array $rows = [], bool $transaction = true): int
    {
        $rowCount = 0;
        try {
            if ($transaction || !$this->getConnect()->inTransaction()) {
                $this->getConnect()->beginTransaction();
            }
            $statement = $this->getConnect()->prepare($stmt);
            foreach ($rows as $row) {
                $statement->execute($row);
                $rowCount += $statement->rowCount();
            }
            unset($statement);
            if ($transaction || $this->getConnect()->inTransaction()) {
                $this->getConnect()->commit();
            }
            return $rowCount;
        } catch (Throwable $t) {
            if ($transaction || $this->getConnect()->inTransaction()) {
                $this->getConnect()->rollBack();
            }
            // Only for debug
            if (ENV_IS_DEV) {
                echo '<pre>';
                echo $t->getMessage();
                echo '<hr>';
                echo $t->getTraceAsString();
                echo '<hr>';
                echo $stmt;
            }
            throw new PDOException($t->getMessage(), (int)$t->getCode(), $t);
        }
    }

    /**
     * @param string $stmt
     * @param array $rows
     * @param bool $transaction
     * @return int
     */
    private function tryQueryFasterSequences(string $stmt, array $rows = [], bool $transaction = true): int
    {
        $hardLimit = 65535;
        $rowCount = 0;
        try {
            if ($transaction || !$this->getConnect()->inTransaction()) {
                $this->getConnect()->beginTransaction();
            }
            $i = 0;
            $slice = $rows;
            while (count($slice)){
                $paramUsed = 0;
                $insert_values = array();
                $question_marks = array();
                $preparedQuery = $stmt;
                foreach ($slice as $row) {
                    if (($paramUsed += count($row)) > $hardLimit){
                        break;
                    }
                    $i++;
                    $question_marks[] = '('  . $this->placeholders('?', sizeof($row)) . ')';
                    array_push($insert_values, ...array_values($row));
                }
                $preparedQuery .= " VALUES " . implode(',', $question_marks);
                $statement = $this->getConnect()->prepare($preparedQuery);
                $statement->execute($insert_values);
                $rowCount += $statement->rowCount();
                $statement->closeCursor();
                unset($statement);
                $slice = array_slice($rows,$i);
            }

            if ($transaction || $this->getConnect()->inTransaction()) {
                $this->getConnect()->commit();
            }
            return $rowCount;
        } catch (Throwable $t) {
            if ($transaction || $this->getConnect()->inTransaction()) {
                $this->getConnect()->rollBack();
            }
            if (ENV_IS_DEV) {echo $stmt;}
            throw new PDOException($t->getMessage(), (int)$t->getCode(), $t);
        }
    }

    /**
     * @param string $text
     * @param int $count
     * @param string $separator
     * @return string
     */
    private static function placeholders(string $text, int $count = 0, string $separator = ","):string {
        $result = ($count > 0) ? array_fill(0, $count, $text) : [];
        return implode($separator, $result);
    }

    /**
     * @param string $prefix
     * @param array<int, mixed> $values
     * @param array<string, mixed> $bindArray
     * @return string
     */
    private static function bindParamArray(string $prefix, array $values, array &$bindArray):string
    {
        $str = "";
        foreach($values as $index => $value){
            $str .= ":".$prefix.$index.",";
            $bindArray[$prefix.$index] = $value;
        }
        return rtrim($str,",");
    }


    /**
     * @param PDOStatement $statement
     * @param  PDO::FETCH_* $statement $mode PDO::FETCH_* constants
     * @return boolean|array false on failure
     */
    private function getQueryRecord(\PDOStatement $statement, $mode = \PDO::FETCH_ASSOC){
        try{
            return $statement->fetch($mode);
        }
        catch (\Exception $e) {
            $message = [$e->getMessage(), (int)$e->getCode(), $e];
            if(ENV_IS_DEV){
                echo '<pre>'.print_r($message,1).'</pre>';
            }
        }
        return false;
    }

    /**
     * @param PDOStatement $statement
     * @param  PDO::FETCH_* $statement $mode PDO::FETCH_* constants
     * @return boolean|array false on failure
     */
    private function getQueryRecords(\PDOStatement $statement, $mode = \PDO::FETCH_ASSOC){
        try{
            return $statement->fetchAll($mode);
        }
        catch (\Exception $e) {
            $message = [$e->getMessage(), (int)$e->getCode(), $e];
            if(ENV_IS_DEV){
                echo '<pre>'.print_r($message,1).'</pre>';
            }
        }
        return false;
    }

    /**
     * @param PDOStatement $statement
     * @return int|boolean Returns the number of rows affected by the last SQL statement or false on failure
     */
    private function getQueryAffectedRows(\PDOStatement $statement){
        try{
            return $statement->rowCount();
        }
        catch (\Exception $e) {
            $message = [$e->getMessage(), (int)$e->getCode(), $e];
            if(ENV_IS_DEV){
                echo '<pre>'.print_r($message,1).'</pre>';
            }
        }
        return false;
    }
}